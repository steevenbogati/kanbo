import type { Metadata } from "next";
import { CheckCircle2, PartyPopper, TriangleAlert } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { getProjects, getTasks, getTeam } from "@/lib/queries";
import { sortTasks } from "@/lib/task-order";
import { todayISO } from "@/lib/dates";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

export const metadata: Metadata = { title: "Mi día" };

function TaskGrid({
  tasks,
  team,
  projects,
  isAdmin,
}: {
  tasks: TaskOverview[];
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  return (
    <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} team={team} projects={projects} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

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
  const firstName = profile.full_name.split(" ")[0] || profile.username;

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
        action={<NewTaskButton team={team} projects={projects} isAdmin={isAdmin} />}
      />

      <div className="space-y-7">
        {overdue.length > 0 && (
          <section className="space-y-2.5">
            <SectionTitle count={overdue.length} tone="danger">
              <TriangleAlert className="size-4" />
              Vencidas
            </SectionTitle>
            <TaskGrid tasks={overdue} team={team} projects={projects} isAdmin={isAdmin} />
          </section>
        )}

        {rest.length > 0 && (
          <section className="space-y-2.5">
            <SectionTitle count={rest.length}>Por prioridad y fecha</SectionTitle>
            <TaskGrid tasks={rest} team={team} projects={projects} isAdmin={isAdmin} />
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
            <TaskGrid tasks={doneToday} team={team} projects={projects} isAdmin={isAdmin} />
          </section>
        )}
      </div>
    </>
  );
}
