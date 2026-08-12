"use client";

import { useAuth } from "@/components/auth-provider";
import { fetchProjects, fetchTasks, fetchTeam } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { PageHeader } from "@/components/page-header";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { Board } from "@/components/tasks/board";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export default function BoardPage() {
  const { isAdmin } = useAuth();

  const { data, loading, error, refresh } = useData(async () => {
    const [tasks, team, projects] = await Promise.all([
      fetchTasks(),
      fetchTeam(),
      fetchProjects(),
    ]);
    return { tasks, team, projects };
  });

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title="Tablero" />;

  return (
    <>
      <PageHeader
        eyebrow="Trabajo"
        title="Tablero"
        subtitle="Arrastra una tarjeta para cambiarle el estado. En el celular, mantén el dedo un momento y luego mueve, o usa el menú de la tarjeta."
        action={<NewTaskButton team={data.team} projects={data.projects} onSaved={refresh} />}
      />

      <Board
        tasks={data.tasks}
        team={data.team}
        projects={data.projects}
        isAdmin={isAdmin}
        onChanged={refresh}
      />
    </>
  );
}
