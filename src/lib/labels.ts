import type { RecurrenceKind, TaskPriority, TaskStatus, UserRole } from "@/lib/types/database";

/** Everything stored in English, everything shown in Spanish. */

export const STATUS_ORDER: TaskStatus[] = ["backlog", "in_progress", "in_review", "done"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Por hacer",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Hecho",
};

/** Text shown when a board column has nothing in it. */
export const STATUS_EMPTY: Record<TaskStatus, string> = {
  backlog: "Nada por hacer",
  in_progress: "Nada en progreso",
  in_review: "Nada por revisar",
  done: "Nada entregado todavía",
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

/**
 * Status palette, reserved. Every use pairs the color with a word, so nothing
 * depends on color alone.
 */
export const PRIORITY_CHIP: Record<TaskPriority, string> = {
  high: "bg-high-soft text-high",
  medium: "bg-medium-soft text-medium",
  low: "bg-low-soft text-low",
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  backlog: "bg-low",
  in_progress: "bg-primary",
  in_review: "bg-medium",
  done: "bg-done",
};

export const STATUS_CHIP: Record<TaskStatus, string> = {
  backlog: "bg-low-soft text-low",
  in_progress: "bg-accent text-accent-foreground",
  in_review: "bg-medium-soft text-medium",
  done: "bg-done-soft text-done",
};
