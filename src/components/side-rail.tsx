"use client";

import { CalendarClock, TriangleAlert, Users } from "lucide-react";

import { Link } from "@/components/app-link";
import { Avatar } from "@/components/user-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import { PRIORITY_DOT, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { Profile, TaskOverview } from "@/lib/types/database";

function Panel({
  title,
  icon: Icon,
  moreHref,
  children,
}: {
  title: string;
  icon: typeof Users;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-2.5 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="ml-auto text-[12px] font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver todas
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/** One task as a compact line: dot, title, and where it stands. */
function TaskLine({ task, showAssignee }: { task: TaskOverview; showAssignee?: boolean }) {
  return (
    <li>
      <Link
        href={`/tarea?id=${task.id}`}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-card"
      >
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium leading-tight group-hover:underline">
            {task.title}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
            {task.is_overdue ? `Era para el ${formatDate(task.due_date)}` : STATUS_LABEL[task.status]}
            {" · "}
            {PRIORITY_LABEL[task.priority]}
          </span>
        </span>

        {showAssignee && task.assignee_name && (
          <Avatar
            name={task.assignee_name}
            title={task.assignee_name}
            className="size-6 shrink-0 text-[10px]"
          />
        )}
      </Link>
    </li>
  );
}

/**
 * The right-hand column: the two lists you want in the corner of your eye.
 * On a phone it moves below the content instead of disappearing.
 */
export function SideRail({
  overdue,
  team,
  tasksByPerson,
  isAdmin,
}: {
  overdue: TaskOverview[];
  team: Profile[];
  tasksByPerson: Map<string, number>;
  isAdmin: boolean;
}) {
  return (
    <aside className="space-y-6 rounded-[22px] bg-panel/80 p-4 lg:p-5">
      <Panel title="Vencidas" icon={TriangleAlert} moreHref="/lista?vencidas=1">
        {overdue.length === 0 ? (
          <p className="flex items-start gap-2 rounded-xl bg-done-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-done">
            <CalendarClock className="mt-px size-3.5 shrink-0" />
            Nada vencido. Vas al día.
          </p>
        ) : (
          <ul className="-mx-2">
            {overdue.slice(0, 4).map((task) => (
              <TaskLine key={task.id} task={task} showAssignee={isAdmin} />
            ))}
          </ul>
        )}
      </Panel>

      {isAdmin && (
        <Panel title="Equipo" icon={Users} moreHref="/panel">
          <ul className="-mx-2">
            {team.map((person) => {
              const count = tasksByPerson.get(person.id) ?? 0;

              return (
                <li key={person.id}>
                  <Link
                    href={`/lista?responsable=${person.id}`}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-card"
                  >
                    <Avatar
                      name={person.full_name}
                      fallback={person.username}
                      className="size-8 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium leading-tight group-hover:underline">
                        {person.full_name || person.username}
                      </span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">
                        {count === 0
                          ? "Sin tareas abiertas"
                          : `${count} ${count === 1 ? "tarea abierta" : "tareas abiertas"}`}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </aside>
  );
}
