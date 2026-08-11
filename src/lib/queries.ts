import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { PRIORITY_ORDER, STATUS_ORDER } from "@/lib/labels";
import type {
  Profile,
  Project,
  TaskOverview,
  TaskPriority,
  TaskStatus,
  WorkloadByPerson,
} from "@/lib/types/database";

/**
 * Read helpers for server components. Every one of them runs as the signed-in
 * user, so RLS decides what comes back: a member only ever sees their own tasks.
 */

export async function getTeam(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  return data ?? [];
}

export async function getProjects(includeArchived = false): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase.from("projects").select("*").order("name");
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

export async function getTasks(filters: TaskFilters = {}): Promise<TaskOverview[]> {
  const supabase = await createClient();
  let query = supabase.from("v_task_overview").select("*");

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

  if (filters.search) query = query.ilike("title", `%${filters.search}%`);

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar las tareas: ${error.message}`);
  return data ?? [];
}

export async function getTask(id: string): Promise<TaskOverview | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("v_task_overview").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getComments(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  return data ?? [];
}

export async function getActivity(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_activity")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  return data ?? [];
}

/** Attachments with a signed URL valid for one hour. */
export async function getAttachments(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");

  const files = data ?? [];
  if (files.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from("task-files")
    .createSignedUrls(
      files.map((file) => file.storage_path),
      60 * 60,
    );

  return files.map((file, index) => ({
    ...file,
    url: signed?.[index]?.signedUrl ?? null,
  }));
}

export async function getWorkload(): Promise<WorkloadByPerson[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("v_workload_by_person").select("*").order("full_name");
  return data ?? [];
}
