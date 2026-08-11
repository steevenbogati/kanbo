import type { Metadata } from "next";

import { requireSession } from "@/lib/auth";
import { getProjects, getTasks, getTeam } from "@/lib/queries";
import { sortTasks } from "@/lib/task-order";
import { STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { TaskFilters } from "@/components/tasks/filters";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata: Metadata = { title: "Lista · Kanbo" };

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { isAdmin } = await requireSession();
  const params = await searchParams;

  const [tasks, team, projects] = await Promise.all([
    getTasks({
      assignee: params.responsable,
      status: params.estado,
      priority: params.prioridad,
      project: params.proyecto,
      overdue: params.vencidas === "1",
      search: params.buscar,
    }),
    getTeam(),
    getProjects(),
  ]);

  const sorted = sortTasks(tasks);

  return (
    <>
      <PageHeader
        title="Lista"
        subtitle={`${sorted.length} ${sorted.length === 1 ? "tarea" : "tareas"}`}
        action={<NewTaskButton team={team} projects={projects} isAdmin={isAdmin} />}
      />

      <TaskFilters team={team} projects={projects} isAdmin={isAdmin} />

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay tareas con esos filtros.
        </p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
          {sorted.map((task) => (
            <div key={task.id} className="space-y-1">
              <p className="px-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {STATUS_LABEL[task.status]}
              </p>
              <TaskCard task={task} team={team} projects={projects} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
