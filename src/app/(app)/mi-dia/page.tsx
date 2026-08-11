import type { Metadata } from "next";

import { requireSession } from "@/lib/auth";
import { getProjects, getTasks, getTeam } from "@/lib/queries";
import { sortTasks } from "@/lib/task-order";
import { todayISO } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata: Metadata = { title: "Mi día · Kanbo" };

export default async function MyDayPage() {
  const { userId, profile, isAdmin } = await requireSession();

  const [tasks, team, projects] = await Promise.all([
    getTasks({ assignee: userId }),
    getTeam(),
    getProjects(),
  ]);

  const open = sortTasks(tasks.filter((task) => task.status !== "done"));
  const today = todayISO();
  const doneToday = tasks.filter(
    (task) => task.status === "done" && task.completed_at?.slice(0, 10) === today,
  );

  const overdue = open.filter((task) => task.is_overdue);
  const rest = open.filter((task) => !task.is_overdue);

  return (
    <>
      <PageHeader
        title={`Hola, ${profile.full_name.split(" ")[0] || "qué tal"}`}
        subtitle={
          open.length === 0
            ? "No tienes tareas abiertas. Disfruta el día."
            : `Tienes ${open.length} ${open.length === 1 ? "tarea abierta" : "tareas abiertas"}${
                overdue.length > 0 ? `, ${overdue.length} vencida${overdue.length === 1 ? "" : "s"}` : ""
              }.`
        }
        action={<NewTaskButton team={team} projects={projects} isAdmin={isAdmin} />}
      />

      <div className="space-y-6">
        {overdue.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-red-600 dark:text-red-400">
              Vencidas ({overdue.length})
            </h2>
            <div className="grid gap-2 lg:grid-cols-2">
              {overdue.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  team={team}
                  projects={projects}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Por prioridad y fecha</h2>
            <div className="grid gap-2 lg:grid-cols-2">
              {rest.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  team={team}
                  projects={projects}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </section>
        )}

        {open.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nada pendiente por ahora.
          </p>
        )}

        {doneToday.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Terminadas hoy ({doneToday.length})
            </h2>
            <div className="grid gap-2 lg:grid-cols-2">
              {doneToday.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  team={team}
                  projects={projects}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
