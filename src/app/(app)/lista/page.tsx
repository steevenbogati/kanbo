"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { fetchProjects, fetchTasks, fetchTeam } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { sortTasks } from "@/lib/task-order";
import { STATUS_CHIP, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { TaskFilters } from "@/components/tasks/filters";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";

function ListContent() {
  const { isAdmin } = useAuth();
  const params = useSearchParams();

  const assignee = params.get("responsable") ?? undefined;
  const status = params.get("estado") ?? undefined;
  const priority = params.get("prioridad") ?? undefined;
  const project = params.get("proyecto") ?? undefined;
  const overdue = params.get("vencidas") === "1";
  const search = params.get("buscar") ?? undefined;

  const { data, loading, error, refresh } = useData(
    async () => {
      const [tasks, team, projects] = await Promise.all([
        fetchTasks({ assignee, status, priority, project, overdue, search }),
        fetchTeam(),
        fetchProjects(),
      ]);
      return { tasks, team, projects };
    },
    [assignee, status, priority, project, overdue, search],
  );

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title="Lista" />;

  const sorted = sortTasks(data.tasks);

  // Grouped by state, so a long list stays readable.
  const groups = STATUS_ORDER.map((value) => ({
    status: value,
    tasks: sorted.filter((task) => task.status === value),
  })).filter((group) => group.tasks.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Trabajo"
        title="Todas las tareas"
        subtitle={`${sorted.length} ${sorted.length === 1 ? "tarea" : "tareas"} con los filtros actuales`}
        action={<NewTaskButton team={data.team} projects={data.projects} onSaved={refresh} />}
      />

      <TaskFilters team={data.team} projects={data.projects} isAdmin={isAdmin} />

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
                    team={data.team}
                    projects={data.projects}
                    isAdmin={isAdmin}
                    onChanged={refresh}
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

export default function ListPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Lista" />}>
      <ListContent />
    </Suspense>
  );
}
