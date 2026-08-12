"use client";

import { CheckCircle2, PartyPopper, TriangleAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { fetchProjects, fetchTasks, fetchTeam } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { sortTasks } from "@/lib/task-order";
import { todayISO } from "@/lib/dates";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

export default function MyDayPage() {
  const { userId, profile, isAdmin } = useAuth();

  const { data, loading, error, refresh } = useData(
    async () => {
      const [tasks, team, projects] = await Promise.all([
        fetchTasks({ assignee: userId }),
        fetchTeam(),
        fetchProjects(),
      ]);
      return { tasks, team, projects };
    },
    [userId],
  );

  const firstName = profile.full_name.split(" ")[0] || profile.username;

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title={`Hola, ${firstName}`} />;

  const open = sortTasks(data.tasks.filter((task) => task.status !== "done"));
  const today = todayISO();
  const doneToday = data.tasks.filter(
    (task) => task.status === "done" && task.completed_at?.slice(0, 10) === today,
  );

  const overdue = open.filter((task) => task.is_overdue);
  const rest = open.filter((task) => !task.is_overdue);

  const grid = (tasks: TaskOverview[], team: Profile[], projects: Project[]) => (
    <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          team={team}
          projects={projects}
          isAdmin={isAdmin}
          onChanged={refresh}
        />
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName}`}
        subtitle={
          open.length === 0
            ? "No tienes tareas abiertas."
            : `${open.length} ${open.length === 1 ? "tarea abierta" : "tareas abiertas"}${
                overdue.length > 0
                  ? ` · ${overdue.length} vencida${overdue.length === 1 ? "" : "s"}`
                  : ""
              }`
        }
        action={<NewTaskButton team={data.team} projects={data.projects} onSaved={refresh} />}
      />

      <div className="space-y-7">
        {overdue.length > 0 && (
          <section className="space-y-2.5">
            <SectionTitle count={overdue.length} tone="danger">
              <TriangleAlert className="size-4" />
              Vencidas
            </SectionTitle>
            {grid(overdue, data.team, data.projects)}
          </section>
        )}

        {rest.length > 0 && (
          <section className="space-y-2.5">
            <SectionTitle count={rest.length}>Por prioridad y fecha</SectionTitle>
            {grid(rest, data.team, data.projects)}
          </section>
        )}

        {open.length === 0 && (
          <EmptyState
            icon={PartyPopper}
            title="Nada pendiente por ahora"
            hint="Cuando te asignen una tarea, aparecerá aquí y te llegará un correo."
          />
        )}

        {doneToday.length > 0 && (
          <section className="space-y-2.5">
            <SectionTitle count={doneToday.length} tone="muted">
              <CheckCircle2 className="size-4" />
              Terminadas hoy
            </SectionTitle>
            {grid(doneToday, data.team, data.projects)}
          </section>
        )}
      </div>
    </>
  );
}
