import { supabase } from "@/lib/supabase/browser";
import { todayISO } from "@/lib/dates";
import { PRIORITY_ORDER, STATUS_ORDER } from "@/lib/labels";
import type {
  Notification,
  Profile,
  Project,
  RecurrenceKind,
  TaskChecklistItem,
  TaskDependency,
  TaskOverview,
  TaskPriority,
  TaskStatus,
  TaskTemplate,
  TaskTimeEntry,
  WorkloadByPerson,
} from "@/lib/types/database";

/**
 * Every read and write of the app. All of it goes through the signed-in user's
 * session, so Row Level Security decides what comes back and what is allowed:
 * a member only ever sees the tasks where they are the assignee or the creator.
 */

export type Result = { error: string | null };

const ok: Result = { error: null };

function fail(message: string, error: { message: string } | null): Result {
  return { error: `${message}: ${error?.message ?? "error desconocido"}` };
}

// ── Reads ───────────────────────────────────────────────────────────────────

export async function fetchTeam(includeInactive = false): Promise<Profile[]> {
  let query = supabase().from("profiles").select("*").order("full_name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data } = await query;
  return data ?? [];
}

export async function fetchProjects(includeArchived = false): Promise<Project[]> {
  let query = supabase().from("projects").select("*").order("name");
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data } = await query;
  return data ?? [];
}

export type TaskFilters = {
  assignee?: string;
  status?: string;
  priority?: string;
  project?: string;
  overdue?: boolean;
  search?: string;
};

export async function fetchTasks(filters: TaskFilters = {}): Promise<TaskOverview[]> {
  let query = supabase().from("v_task_overview").select("*");

  if (filters.assignee === "sin-responsable") query = query.is("assignee_id", null);
  else if (filters.assignee) query = query.eq("assignee_id", filters.assignee);

  // The values come from the URL, so they are validated before querying.
  if (filters.status && STATUS_ORDER.includes(filters.status as TaskStatus)) {
    query = query.eq("status", filters.status as TaskStatus);
  }
  if (filters.priority && PRIORITY_ORDER.includes(filters.priority as TaskPriority)) {
    query = query.eq("priority", filters.priority as TaskPriority);
  }

  if (filters.project === "sin-proyecto") query = query.is("project_id", null);
  else if (filters.project) query = query.eq("project_id", filters.project);

  if (filters.overdue) {
    query = query.neq("status", "done").not("due_date", "is", null).lt("due_date", todayISO());
  }

  if (filters.search) {
    const search = filters.search.replace(/[(),]/g, " ").trim();
    const { data: commentMatches } = await supabase()
      .from("task_comments")
      .select("task_id")
      .ilike("body", `%${search}%`);
    const ids = [...new Set((commentMatches ?? []).map((row) => row.task_id))];
    const parts = [
      `title.ilike.%${search}%`,
      `description.ilike.%${search}%`,
      `external_url.ilike.%${search}%`,
      `project_name.ilike.%${search}%`,
      `assignee_name.ilike.%${search}%`,
    ];
    if (ids.length > 0) parts.push(`id.in.(${ids.join(",")})`);
    query = query.or(parts.join(","));
  }

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar las tareas: ${error.message}`);
  return data ?? [];
}

export async function fetchTask(id: string): Promise<TaskOverview | null> {
  const { data } = await supabase().from("v_task_overview").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function fetchComments(taskId: string) {
  const { data } = await supabase()
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  return data ?? [];
}

export async function fetchActivity(taskId: string) {
  const { data } = await supabase()
    .from("task_activity")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  return data ?? [];
}

/** Attachments with a signed URL valid for one hour. */
export async function fetchAttachments(taskId: string) {
  const { data } = await supabase()
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");

  const files = data ?? [];
  if (files.length === 0) return [];

  const { data: signed } = await supabase()
    .storage.from("task-files")
    .createSignedUrls(
      files.map((file) => file.storage_path),
      60 * 60,
    );

  return files.map((file, index) => ({ ...file, url: signed?.[index]?.signedUrl ?? null }));
}

export async function fetchWorkload(): Promise<WorkloadByPerson[]> {
  const { data } = await supabase().from("v_workload_by_person").select("*").order("full_name");
  return data ?? [];
}

// ── Writes ──────────────────────────────────────────────────────────────────

export type TaskInput = {
  title: string;
  description: string;
  assignee_id: string | null;
  project_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  external_url: string | null;
  recurrence: RecurrenceKind;
  estimated_hours: number;
};

export async function createTask(input: TaskInput, createdBy: string): Promise<Result> {
  const { error } = await supabase()
    .from("tasks")
    .insert({ ...input, created_by: createdBy });

  return error ? fail("No se pudo crear la tarea", error) : ok;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Result> {
  const { error } = await supabase().from("tasks").update(input).eq("id", id);
  return error ? fail("No se pudo guardar la tarea", error) : ok;
}

export async function moveTask(id: string, status: TaskStatus): Promise<Result> {
  if (!STATUS_ORDER.includes(status)) return { error: "Estado inválido." };

  const { error } = await supabase().from("tasks").update({ status }).eq("id", id);
  return error ? fail("No se pudo mover la tarea", error) : ok;
}

/** Only the admin may delete: RLS returns zero rows for anybody else. */
export async function deleteTask(id: string): Promise<Result> {
  const { data, error } = await supabase().from("tasks").delete().eq("id", id).select("id");

  if (error) return fail("No se pudo borrar la tarea", error);
  if (!data || data.length === 0) {
    return { error: "Solo el administrador puede borrar tareas." };
  }
  return ok;
}

export async function addComment(taskId: string, authorId: string, body: string): Promise<Result> {
  const text = body.trim();
  if (!text) return { error: "Escribe algo antes de enviar." };

  const { error } = await supabase()
    .from("task_comments")
    .insert({ task_id: taskId, author_id: authorId, body: text });

  return error ? fail("No se pudo publicar el comentario", error) : ok;
}

export async function deleteComment(id: string): Promise<Result> {
  const { error } = await supabase().from("task_comments").delete().eq("id", id);
  return error ? fail("No se pudo borrar el comentario", error) : ok;
}

export async function uploadAttachment(
  taskId: string,
  file: File,
  uploadedBy: string,
): Promise<Result> {
  const path = `${taskId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase().storage.from("task-files").upload(path, file);
  if (uploadError) return fail("No se pudo subir el archivo", uploadError);

  const { error } = await supabase().from("task_attachments").insert({
    task_id: taskId,
    storage_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || "application/octet-stream",
    uploaded_by: uploadedBy,
  });

  return error ? fail("No se pudo guardar el archivo", error) : ok;
}

export async function deleteAttachment(id: string, storagePath: string): Promise<Result> {
  const { error } = await supabase().from("task_attachments").delete().eq("id", id);
  if (error) return fail("No se pudo borrar el archivo", error);

  await supabase().storage.from("task-files").remove([storagePath]);
  return ok;
}

export async function createProject(
  name: string,
  clientName: string,
  createdBy: string,
  budgetAmount = 0,
  hourlyRate = 0,
): Promise<Result> {
  if (!name.trim()) return { error: "Ponle un nombre al proyecto." };

  const { error } = await supabase()
    .from("projects")
    .insert({ name: name.trim(), client_name: clientName.trim(), created_by: createdBy, budget_amount: budgetAmount, hourly_rate: hourlyRate });

  if (error) {
    return error.code === "42501"
      ? { error: "Solo el administrador puede crear proyectos." }
      : fail("No se pudo crear el proyecto", error);
  }
  return ok;
}

export async function setProjectArchived(id: string, archived: boolean): Promise<Result> {
  const { data, error } = await supabase()
    .from("projects")
    .update({ is_archived: archived })
    .eq("id", id)
    .select("id");

  if (error) return fail("No se pudo actualizar el proyecto", error);
  if (!data || data.length === 0) {
    return { error: "Solo el administrador puede archivar proyectos." };
  }
  return ok;
}

export async function updateProfile(id: string, changes: Partial<Pick<Profile, "full_name" | "email" | "role" | "is_active">>): Promise<Result> {
  const { error } = await supabase().from("profiles").update(changes).eq("id", id);
  return error ? fail("No se pudo actualizar la cuenta", error) : ok;
}

// V2 workspace tools ---------------------------------------------------------

export async function fetchChecklist(taskId: string): Promise<TaskChecklistItem[]> {
  const { data } = await supabase()
    .from("task_checklist")
    .select("*")
    .eq("task_id", taskId)
    .order("position")
    .order("created_at");
  return data ?? [];
}

export async function addChecklistItem(taskId: string, createdBy: string, label: string): Promise<Result> {
  const text = label.trim();
  if (!text) return { error: "Escribe un punto antes de agregarlo." };
  const { error } = await supabase().from("task_checklist").insert({
    task_id: taskId,
    created_by: createdBy,
    label: text,
  });
  return error ? fail("No se pudo agregar el punto", error) : ok;
}

export async function toggleChecklistItem(id: string, isDone: boolean): Promise<Result> {
  const { error } = await supabase().from("task_checklist").update({ is_done: isDone }).eq("id", id);
  return error ? fail("No se pudo actualizar el punto", error) : ok;
}

export async function deleteChecklistItem(id: string): Promise<Result> {
  const { error } = await supabase().from("task_checklist").delete().eq("id", id);
  return error ? fail("No se pudo borrar el punto", error) : ok;
}

export async function fetchTimeEntries(taskId: string): Promise<TaskTimeEntry[]> {
  const { data } = await supabase()
    .from("task_time_entries")
    .select("*")
    .eq("task_id", taskId)
    .order("started_at", { ascending: false });
  return data ?? [];
}

export async function startTimeEntry(taskId: string, userId: string): Promise<Result> {
  const { data: active } = await supabase()
    .from("task_time_entries")
    .select("id")
    .eq("user_id", userId)
    .is("stopped_at", null)
    .maybeSingle();
  if (active) return { error: "Ya tienes un contador activo en otra tarea." };

  const { error } = await supabase().from("task_time_entries").insert({
    task_id: taskId,
    user_id: userId,
  });
  return error ? fail("No se pudo iniciar el contador", error) : ok;
}

export async function stopTimeEntry(id: string): Promise<Result> {
  const { error } = await supabase()
    .from("task_time_entries")
    .update({ stopped_at: new Date().toISOString() })
    .eq("id", id);
  return error ? fail("No se pudo detener el contador", error) : ok;
}

export async function fetchDependencies(taskId: string): Promise<TaskDependency[]> {
  const { data } = await supabase()
    .from("task_dependencies")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  return data ?? [];
}

export async function addDependency(taskId: string, dependsOnId: string, createdBy: string): Promise<Result> {
  if (taskId === dependsOnId) return { error: "Una tarea no puede depender de sí misma." };
  const { error } = await supabase().from("task_dependencies").insert({
    task_id: taskId,
    depends_on_id: dependsOnId,
    created_by: createdBy,
  });
  return error ? fail("No se pudo agregar el bloqueo", error) : ok;
}

export async function removeDependency(taskId: string, dependsOnId: string): Promise<Result> {
  const { error } = await supabase()
    .from("task_dependencies")
    .delete()
    .eq("task_id", taskId)
    .eq("depends_on_id", dependsOnId);
  return error ? fail("No se pudo quitar el bloqueo", error) : ok;
}

export async function bulkUpdateTasks(
  ids: string[],
  changes: { status?: TaskStatus; priority?: TaskPriority },
): Promise<Result> {
  if (ids.length === 0) return { error: "Selecciona al menos una tarea." };
  const { error } = await supabase().from("tasks").update(changes).in("id", ids);
  return error ? fail("No se pudieron actualizar las tareas", error) : ok;
}

export async function duplicateTask(id: string, createdBy: string, isAdmin: boolean): Promise<Result> {
  const { data: source, error: readError } = await supabase()
    .from("tasks")
    .select("title, description, assignee_id, project_id, priority, due_date, external_url, estimated_hours")
    .eq("id", id)
    .maybeSingle();
  if (readError) return fail("No se pudo leer la tarea", readError);
  if (!source) return { error: "No encontramos esa tarea." };

  const { error } = await supabase().from("tasks").insert({
    ...source,
    title: `Copia de ${source.title}`,
    assignee_id: isAdmin ? source.assignee_id : createdBy,
    status: "backlog",
    due_date: null,
    recurrence: "none",
    created_by: createdBy,
  });
  return error ? fail("No se pudo duplicar la tarea", error) : ok;
}

export async function fetchNotifications(): Promise<Notification[]> {
  await supabase().rpc("prepare_due_notifications");
  const { data } = await supabase()
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<Result> {
  const { error } = await supabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  return error ? fail("No se pudo marcar la notificación", error) : ok;
}

export async function markAllNotificationsRead(): Promise<Result> {
  const { error } = await supabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  return error ? fail("No se pudieron marcar las notificaciones", error) : ok;
}

export async function fetchTemplates(): Promise<TaskTemplate[]> {
  const { data } = await supabase().from("task_templates").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createTemplate(
  input: Omit<TaskTemplate, "id" | "created_at" | "created_by">,
  createdBy: string,
): Promise<Result> {
  const { error } = await supabase().from("task_templates").insert({ ...input, created_by: createdBy });
  return error ? fail("No se pudo guardar la plantilla", error) : ok;
}

export async function deleteTemplate(id: string): Promise<Result> {
  const { error } = await supabase().from("task_templates").delete().eq("id", id);
  return error ? fail("No se pudo borrar la plantilla", error) : ok;
}

export async function createTaskFromTemplate(
  template: TaskTemplate,
  createdBy: string,
  assigneeId: string | null,
): Promise<Result> {
  const { error } = await supabase().from("tasks").insert({
    title: template.title,
    description: template.description,
    assignee_id: assigneeId,
    project_id: template.project_id,
    priority: template.priority,
    status: "backlog",
    due_date: null,
    external_url: null,
    recurrence: template.recurrence,
    estimated_hours: template.estimated_hours,
    created_by: createdBy,
  });
  return error ? fail("No se pudo crear la tarea desde la plantilla", error) : ok;
}

/** Keeps only characters that are safe in a Storage path. */
function safeFileName(name: string): string {
  return name
    .normalize("NFD") // splits accents off, then the next line drops them
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-80);
}
