import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { getProjects, getTasks, getTeam } from "@/lib/queries";
import { sortTasks } from "@/lib/task-order";
import { STATUS_CHIP, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskFilters } from "@/components/tasks/filters";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata: Metadata = { title: "Lista" };

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

  // Grouped by state, so a long list stays readable.
  const groups = STATUS_ORDER.map((status) => ({
    status,
    tasks: sorted.filter((task) => task.status === status),
  })).filter((group) => group.tasks.length > 0);

  return (
    <>
      <PageHeader
        title="Lista"
        subtitle={`${sorted.length} ${sorted.length === 1 ? "tarea" : "tareas"} con los filtros actuales`}
        action={<NewTaskButton team={team} projects={projects} isAdmin={isAdmin} />}
      />

      <TaskFilters team={team} projects={projects} isAdmin={isAdmin} />

      {sorted.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No hay tareas con esos filtros"
          hint="Prueba quitando alguno, o crea una tarea nueva."
        />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.status} className="space-y-2.5">
              <SectionTitle count={group.tasks.length}>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[group.status]}`}
                >
                  {STATUS_LABEL[group.status]}
                </span>
              </SectionTitle>

              <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
                {group.tasks.map((task) => (
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
          ))}
        </div>
      )}
    </>
  );
}
