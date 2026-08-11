import type { Metadata } from "next";

import { requireSession } from "@/lib/auth";
import { getProjects, getTasks, getTeam } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Board } from "@/components/tasks/board";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata: Metadata = { title: "Tablero · Kanbo" };

export default async function BoardPage() {
  const { isAdmin } = await requireSession();
  const [tasks, team, projects] = await Promise.all([getTasks(), getTeam(), getProjects()]);

  return (
    <>
      <PageHeader
        title="Tablero"
        subtitle={
          isAdmin
            ? "Arrastra las tarjetas para cambiar el estado. En el celular usa el menú de cada tarjeta."
            : "Aquí ves tus tareas. Arrastra para cambiar el estado."
        }
        action={<NewTaskButton team={team} projects={projects} isAdmin={isAdmin} />}
      />

      <Board tasks={tasks} team={team} projects={projects} isAdmin={isAdmin} />
    </>
  );
}
