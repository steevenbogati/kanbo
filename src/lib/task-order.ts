import type { TaskOverview, TaskPriority } from "@/lib/types/database";

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * The order the whole app uses: overdue first, then by priority, then by the
 * closest delivery date. Tasks without a date go last.
 */
export function sortTasks(tasks: TaskOverview[]): TaskOverview[] {
  return [...tasks].sort((a, b) => {
    if (a.is_overdue !== b.is_overdue) return a.is_overdue ? -1 : 1;

    const priority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priority !== 0) return priority;

    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    return a.created_at.localeCompare(b.created_at);
  });
}
