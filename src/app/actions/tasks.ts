"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { formatDate } from "@/lib/dates";
import { PRIORITY_LABEL } from "@/lib/labels";
import type { RecurrenceKind, TaskPriority, TaskStatus } from "@/lib/types/database";

import type { ActionState } from "@/lib/action-state";

const STATUSES: TaskStatus[] = ["backlog", "in_progress", "in_review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const RECURRENCES: RecurrenceKind[] = ["none", "daily", "weekly", "monthly"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function refreshTaskViews(taskId?: string) {
  revalidatePath("/tablero");
  revalidatePath("/lista");
  revalidatePath("/mi-dia");
  revalidatePath("/panel");
  if (taskId) revalidatePath(`/tarea/${taskId}`);
}

/** Tells the assignee they got a new task. Silent if email is not configured. */
async function notifyAssignment(taskId: string, actorId: string) {
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("v_task_overview")
    .select("id, title, assignee_id, assignee_name, due_date, priority, project_name")
    .eq("id", taskId)
    .maybeSingle();

  if (!task?.assignee_id || task.assignee_id === actorId) return;

  const { data: assignee } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", task.assignee_id)
    .maybeSingle();

  if (!assignee?.email) return;

  const result = await sendEmail({
    to: assignee.email,
    subject: `Nueva tarea: ${task.title}`,
    heading: "Te asignaron una tarea",
    lines: [
      `<strong>${task.title}</strong>`,
      task.project_name ? `Proyecto: ${task.project_name}` : "Sin proyecto",
      `Prioridad: ${PRIORITY_LABEL[task.priority]}`,
      task.due_date ? `Entrega: ${formatDate(task.due_date)}` : "Sin fecha de entrega",
    ],
    linkPath: `/tarea/${task.id}`,
  });

  // Only a real send counts, so nothing is skipped once email is configured.
  if (result === "sent") {
    await supabase
      .from("tasks")
      .update({ assignment_notified_at: new Date().toISOString() })
      .eq("id", taskId);
  }
}

type TaskValues = {
  title: string;
  description: string;
  assignee_id: string | null;
  project_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  external_url: string | null;
  recurrence: RecurrenceKind;
};

function readTaskForm(
  formData: FormData,
  isAdmin: boolean,
  userId: string,
): { error?: string; values?: TaskValues } {
  const title = text(formData, "title");
  if (!title) return { error: "La tarea necesita un título." };

  const status = text(formData, "status") as TaskStatus;
  const priority = text(formData, "priority") as TaskPriority;
  const recurrence = text(formData, "recurrence") as RecurrenceKind;
  const externalUrl = optional(formData, "external_url");

  if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
    return { error: "El enlace debe empezar con http:// o https://" };
  }

  return {
    values: {
      title,
      description: text(formData, "description"),
      // A member can only work on their own tasks; only the admin picks people.
      assignee_id: isAdmin ? optional(formData, "assignee_id") : userId,
      project_id: optional(formData, "project_id"),
      priority: PRIORITIES.includes(priority) ? priority : "medium",
      status: STATUSES.includes(status) ? status : "backlog",
      due_date: optional(formData, "due_date"),
      external_url: externalUrl,
      recurrence: RECURRENCES.includes(recurrence) ? recurrence : "none",
    },
  };
}

export async function createTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, isAdmin } = await requireSession();
  const parsed = readTaskForm(formData, isAdmin, userId);
  if (!parsed.values) return { ok: false, error: parsed.error ?? "Datos inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...parsed.values, created_by: userId })
    .select("id")
    .single();

  if (error) return { ok: false, error: `No se pudo crear la tarea: ${error.message}` };

  await notifyAssignment(data.id, userId);
  refreshTaskViews(data.id);
  return { ok: true, error: null };
}

export async function updateTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, isAdmin } = await requireSession();
  const id = text(formData, "id");
  if (!id) return { ok: false, error: "Falta la tarea que quieres editar." };

  const parsed = readTaskForm(formData, isAdmin, userId);
  if (!parsed.values) return { ok: false, error: parsed.error ?? "Datos inválidos." };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("tasks")
    .select("assignee_id")
    .eq("id", id)
    .maybeSingle();

  // A member cannot change who is responsible, so that field is left untouched.
  const values = isAdmin
    ? parsed.values
    : { ...parsed.values, assignee_id: before?.assignee_id ?? null };

  const { error } = await supabase.from("tasks").update(values).eq("id", id);
  if (error) return { ok: false, error: `No se pudo guardar la tarea: ${error.message}` };

  if (values.assignee_id && values.assignee_id !== before?.assignee_id) {
    await notifyAssignment(id, userId);
  }

  refreshTaskViews(id);
  return { ok: true, error: null };
}

/** Used by the Kanban board and the quick status menu. */
export async function moveTask(id: string, status: TaskStatus): Promise<ActionState> {
  await requireSession();
  if (!STATUSES.includes(status)) return { ok: false, error: "Estado inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);

  if (error) return { ok: false, error: `No se pudo mover la tarea: ${error.message}` };

  refreshTaskViews(id);
  return { ok: true, error: null };
}

export async function deleteTask(id: string): Promise<ActionState> {
  const { isAdmin } = await requireSession();
  if (!isAdmin) return { ok: false, error: "Solo el administrador puede borrar tareas." };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) return { ok: false, error: `No se pudo borrar la tarea: ${error.message}` };

  refreshTaskViews();
  return { ok: true, error: null };
}

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { userId } = await requireSession();
  const taskId = text(formData, "task_id");
  const body = text(formData, "body");

  if (!body) return { ok: false, error: "Escribe algo antes de enviar." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, author_id: userId, body });

  if (error) return { ok: false, error: `No se pudo publicar el comentario: ${error.message}` };

  revalidatePath(`/tarea/${taskId}`);
  return { ok: true, error: null };
}

export async function deleteComment(id: string, taskId: string): Promise<ActionState> {
  await requireSession();

  const supabase = await createClient();
  const { error } = await supabase.from("task_comments").delete().eq("id", id);

  if (error) return { ok: false, error: `No se pudo borrar el comentario: ${error.message}` };

  revalidatePath(`/tarea/${taskId}`);
  return { ok: true, error: null };
}

/** Saves the row for a file already uploaded to Storage from the browser. */
export async function registerAttachment(input: {
  taskId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<ActionState> {
  const { userId } = await requireSession();

  const supabase = await createClient();
  const { error } = await supabase.from("task_attachments").insert({
    task_id: input.taskId,
    storage_path: input.storagePath,
    file_name: input.fileName,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    uploaded_by: userId,
  });

  if (error) return { ok: false, error: `No se pudo guardar el archivo: ${error.message}` };

  revalidatePath(`/tarea/${input.taskId}`);
  return { ok: true, error: null };
}

export async function deleteAttachment(
  id: string,
  taskId: string,
  storagePath: string,
): Promise<ActionState> {
  await requireSession();

  const supabase = await createClient();
  const { error } = await supabase.from("task_attachments").delete().eq("id", id);
  if (error) return { ok: false, error: `No se pudo borrar el archivo: ${error.message}` };

  await supabase.storage.from("task-files").remove([storagePath]);

  revalidatePath(`/tarea/${taskId}`);
  return { ok: true, error: null };
}
