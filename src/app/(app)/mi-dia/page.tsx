"use client";

import { CheckCircle2, PartyPopper } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { fetchProjects, fetchTasks, fetchTeam } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { sortTasks } from "@/lib/task-order";
import { daysAgoISO, todayISO } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { SideRail } from "@/components/side-rail";
import { HeroTask } from "@/components/tasks/hero-task";
import { TaskRail } from "@/components/tasks/task-rail";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export default function MyDayPage() {
  const { userId, profile, isAdmin } = useAuth();

  const { data, loading, error, refresh } = useData(async () => {
    // The admin also gets the team's picture in the side rail; a member only
    // ever receives their own tasks, because the database filters them.
    const [mine, all, team, projects] = await Promise.all([
      fetchTasks({ assignee: userId }),
      isAdmin ? fetchTasks() : Promise.resolve([]),
      fetchTeam(),
      fetchProjects(),
    ]);
    return { mine, all, team, projects };
  }, [userId, isAdmin]);

  const firstName = profile.full_name.split(" ")[0] || profile.username;

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title={`Hola, ${firstName}`} />;

  const today = todayISO();
  const weekAgo = daysAgoISO(7);

  const open = sortTasks(data.mine.filter((task) => task.status !== "done"));
  const overdue = open.filter((task) => task.is_overdue);
  const dueToday = open.filter((task) => !task.is_overdue && task.due_date === today);
  const later = open.filter((task) => !task.is_overdue && task.due_date !== today);

  const doneToday = data.mine.filter(
    (task) => task.status === "done" && task.completed_at?.slice(0, 10) === today,
  );
  const doneThisWeek = data.mine.filter(
    (task) => task.status === "done" && task.completed_at && task.completed_at >= weekAgo,
  );

  const hero = open[0];

  // For the side rail: everything overdue the person is allowed to see.
  const railSource = isAdmin ? data.all : data.mine;
  const railOverdue = sortTasks(railSource.filter((task) => task.is_overdue));

  const byPerson = new Map<string, number>();
  for (const task of railSource) {
    if (task.status === "done" || !task.assignee_id) continue;
    byPerson.set(task.assignee_id, (byPerson.get(task.assignee_id) ?? 0) + 1);
  }

  const shared = {
    team: data.team,
    projects: data.projects,
    isAdmin,
    onChanged: refresh,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="min-w-0 space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Mi día</p>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight md:text-[30px]">
              Hola, {firstName}
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {open.length === 0
                ? "No tienes tareas abiertas."
                : `${open.length} ${open.length === 1 ? "tarea abierta" : "tareas abiertas"}${
                    overdue.length > 0
                      ? ` · ${overdue.length} vencida${overdue.length === 1 ? "" : "s"}`
                      : ""
                  }`}
            </p>
          </div>

          <NewTaskButton team={data.team} projects={data.projects} onSaved={refresh} />
        </header>

        {hero ? (
          <HeroTask
            task={hero}
            open={open.length}
            doneThisWeek={doneThisWeek.length}
            onChanged={refresh}
          />
        ) : (
          <EmptyState
            icon={PartyPopper}
            title="Nada pendiente por ahora"
            hint="Cuando te asignen una tarea, aparecerá aquí y te llegará un correo."
          />
        )}

        <TaskRail
          title="Vencidas"
          hint="Lo que se pasó de fecha. Empieza por aquí."
          tasks={overdue}
          accent="danger"
          {...shared}
        />

        <TaskRail title="Para hoy" hint="Lo que toca entregar hoy." tasks={dueToday} {...shared} />

        <TaskRail
          title="Lo que viene"
          hint="Ordenado por prioridad y por fecha de entrega."
          tasks={later}
          {...shared}
        />

        {doneToday.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[17px] font-semibold tracking-tight text-muted-foreground">
              <CheckCircle2 className="size-4 text-done" />
              Terminadas hoy
              <span className="nums rounded-full bg-done-soft px-2 py-0.5 text-[11px] font-semibold text-done">
                {doneToday.length}
              </span>
            </h2>
            <ul className="divide-y rounded-[18px] bg-card/70 px-4">
              {doneToday.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-3 text-[13.5px]">
                  <CheckCircle2 className="size-4 shrink-0 text-done" />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground line-through">
                    {task.title}
                  </span>
                  {task.project_name && (
                    <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:block">
                      {task.project_name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <SideRail
        overdue={railOverdue}
        team={data.team}
        tasksByPerson={byPerson}
        isAdmin={isAdmin}
      />
    </div>
  );
}
