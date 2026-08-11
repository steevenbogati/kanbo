/**
 * Database types, kept in sync by hand with /supabase/migrations.
 * If you change a migration, change this file too.
 */

export type UserRole = "admin" | "member";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";
export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  client_name: string;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  project_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  external_url: string | null;
  board_position: number;
  recurrence: RecurrenceKind;
  recurrence_parent_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_days: number | null;
  assignment_notified_at: string | null;
  due_notified_on: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type TaskAttachment = {
  id: string;
  task_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
};

export type TaskActivity = {
  id: string;
  task_id: string;
  actor_id: string | null;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  created_at: string;
};

export type TaskOverview = Omit<
  Task,
  "assignment_notified_at" | "due_notified_on" | "recurrence_parent_id"
> & {
  assignee_name: string | null;
  project_name: string | null;
  client_name: string | null;
  created_by_name: string | null;
  is_overdue: boolean;
  is_due_today: boolean;
};

export type WorkloadByPerson = {
  profile_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  open_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  done_last_7_days: number;
  avg_duration_days: number | null;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      projects: Table<Project>;
      tasks: Table<Task, Partial<Task> & { title: string; created_by: string }>;
      task_comments: Table<
        TaskComment,
        Partial<TaskComment> & { task_id: string; author_id: string; body: string }
      >;
      task_attachments: Table<
        TaskAttachment,
        Partial<TaskAttachment> & {
          task_id: string;
          storage_path: string;
          file_name: string;
          uploaded_by: string;
        }
      >;
      task_activity: Table<TaskActivity>;
    };
    Views: {
      v_task_overview: { Row: TaskOverview; Relationships: [] };
      v_workload_by_person: { Row: WorkloadByPerson; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      recurrence_kind: RecurrenceKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
