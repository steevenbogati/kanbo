import type { RecurrenceKind, TaskPriority, TaskStatus, UserRole } from "@/lib/types/database";

/** Everything stored in English, everything shown in Spanish. */

export const STATUS_ORDER: TaskStatus[] = ["backlog", "in_progress", "in_review", "done"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Por hacer",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Hecho",
};

export const PRIORITY_ORDER: TaskPriority[] = ["high", "medium", "low"];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export const RECURRENCE_LABEL: Record<RecurrenceKind, string> = {
  none: "No se repite",
  daily: "Cada día",
  weekly: "Cada semana",
  monthly: "Cada mes",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  member: "Miembro",
};

/** Tailwind classes per priority, used on badges and card borders. */
export const PRIORITY_STYLE: Record<TaskPriority, string> = {
  high: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  low: "border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300",
};

export const PRIORITY_BAR: Record<TaskPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};
