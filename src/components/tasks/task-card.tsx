"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Link2, Repeat } from "lucide-react";

import { cn } from "@/lib/utils";
import { dueLabel } from "@/lib/dates";
import { PRIORITY_BAR, PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/labels";
import { initials } from "@/components/user-menu";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskMenu } from "@/components/tasks/task-menu";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

const TONE: Record<string, string> = {
  late: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-foreground",
  calm: "text-muted-foreground",
};

export function TaskCard({
  task,
  team,
  projects,
  isAdmin,
  dragHandle,
  isDragging,
}: {
  task: TaskOverview;
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
  /** Props from dnd-kit, when the card lives on the board. */
  dragHandle?: React.HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const due = dueLabel(task.due_date);

  return (
    <>
      <article
        className={cn(
          "group relative flex gap-2 rounded-lg border bg-card p-3 shadow-xs transition-shadow",
          isDragging ? "opacity-60" : "hover:shadow-sm",
          dragHandle && "touch-none",
        )}
        {...dragHandle}
      >
        <span
          aria-hidden
          className={cn("w-1 shrink-0 rounded-full", PRIORITY_BAR[task.priority])}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <Link
              href={`/tarea/${task.id}`}
              className="line-clamp-2 text-sm font-medium hover:underline"
            >
              {task.title}
            </Link>
            <TaskMenu task={task} isAdmin={isAdmin} onEdit={() => setEditing(true)} />
          </div>

          {task.project_name && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {task.client_name ? `${task.project_name} · ${task.client_name}` : task.project_name}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px]",
                PRIORITY_STYLE[task.priority],
              )}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>

            <span className={cn("inline-flex items-center gap-1", TONE[due.tone])}>
              <CalendarClock className="size-3.5" />
              {due.text}
            </span>

            {task.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Repeat className="size-3.5" />
                se repite
              </span>
            )}

            {task.external_url && (
              <Link2 className="size-3.5 text-muted-foreground" aria-label="Tiene enlace" />
            )}

            <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
              {task.assignee_name ? (
                <span
                  title={task.assignee_name}
                  className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
                >
                  {initials(task.assignee_name, "?")}
                </span>
              ) : (
                "sin responsable"
              )}
            </span>
          </div>
        </div>
      </article>

      <TaskDialog
        task={task}
        team={team}
        projects={projects}
        isAdmin={isAdmin}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}
