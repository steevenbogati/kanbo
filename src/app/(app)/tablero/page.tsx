import type { Metadata } from "next";

import { requireSession } from "@/lib/auth";
import { getProjects, getTasks, getTeam } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Board } from "@/components/tasks/board";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata: Metadata = { title: "Tablero" };

export default async function BoardPage() {
  const { isAdmin } = await requireSession();
  const [tasks, team, projects] = await Promise.all([getTasks(), getTeam(), getProjects()]);

  return (
    <>
      <PageHeader
        title="Tablero"
        subtitle="Arrastra una tarjeta para cambiarle el estado. En el celular, mantén el dedo un momento y luego mueve, o usa el menú de la tarjeta."
        action={<NewTaskButton team={team} projects={projects} isAdmin={isAdmin} />}
      />

      <Board tasks={tasks} team={team} projects={projects} isAdmin={isAdmin} />
    </>
  );
}
