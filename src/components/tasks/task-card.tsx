"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Link2, Repeat, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { dueLabel, formatDays } from "@/lib/dates";
import { PRIORITY_CHIP, PRIORITY_DOT, PRIORITY_LABEL } from "@/lib/labels";
import { Avatar } from "@/components/user-menu";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskMenu } from "@/components/tasks/task-menu";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

const DUE_TONE = {
  late: "text-high",
  today: "text-medium",
  soon: "text-foreground",
  calm: "text-muted-foreground",
} as const;

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
  const isDone = task.status === "done";

  // A finished task reports how long it took, not how late it was.
  const due = isDone
    ? {
        text: task.duration_days !== null ? `Entregada en ${formatDays(task.duration_days)}` : "Entregada",
        tone: "calm" as const,
        icon: CheckCircle2,
      }
    : { ...dueLabel(task.due_date), icon: task.is_overdue ? TriangleAlert : CalendarClock };

  const DueIcon = due.icon;

  return (
    <>
      <article
        {...dragHandle}
        className={cn(
          "group relative rounded-xl border bg-card p-3 text-left shadow-xs transition-[box-shadow,border-color,transform] duration-150 ease-out",
          "hover:border-foreground/15 hover:shadow-sm active:scale-[0.995]",
          dragHandle && "cursor-grab touch-none active:cursor-grabbing",
          isDragging && "opacity-50",
          task.is_overdue && !isDone && "border-high/35",
        )}
      >
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className={cn("mt-[7px] size-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
          />

          <div className="min-w-0 flex-1">
            <Link
              href={`/tarea/${task.id}`}
              className={cn(
                "line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight decoration-muted-foreground/40 underline-offset-2 hover:underline",
                isDone && "text-muted-foreground",
              )}
            >
              {task.title}
            </Link>

            {task.project_name && (
              <p className="mt-1 truncate text-[12px] text-muted-foreground">
                {task.client_name ? `${task.project_name} · ${task.client_name}` : task.project_name}
              </p>
            )}
          </div>

          {/* Avatar and menu ride the title row, so a two-line title never
              pushes them onto a line of their own. */}
          {task.assignee_name ? (
            <Avatar
              name={task.assignee_name}
              title={`Responsable: ${task.assignee_name}`}
              className="size-6 text-[10px]"
            />
          ) : (
            <span
              title="Sin responsable"
              className="flex size-6 items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground"
            >
              ?
            </span>
          )}

          <TaskMenu task={task} isAdmin={isAdmin} onEdit={() => setEditing(true)} />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pl-4">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              PRIORITY_CHIP[task.priority],
            )}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 text-[12px] font-medium",
              DUE_TONE[due.tone],
            )}
          >
            <DueIcon className="size-3.5" />
            {due.text}
          </span>

          {task.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <Repeat className="size-3.5" />
              se repite
            </span>
          )}

          {task.external_url && (
            <span
              title="Tiene un enlace"
              className="inline-flex items-center text-muted-foreground"
            >
              <Link2 className="size-3.5" />
              <span className="sr-only">Tiene un enlace</span>
            </span>
          )}
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
