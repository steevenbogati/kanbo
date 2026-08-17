"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckSquare, SearchX, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { bulkUpdateTasks, fetchProjects, fetchTasks, fetchTeam } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { sortTasks } from "@/lib/task-order";
import { STATUS_CHIP, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { TaskFilters } from "@/components/tasks/filters";
import { TaskCard } from "@/components/tasks/task-card";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { NativeSelect } from "@/components/field";
import type { TaskPriority, TaskStatus } from "@/lib/types/database";

function ListContent() {
  const { isAdmin } = useAuth();
  const params = useSearchParams();

  const assignee = params.get("responsable") ?? undefined;
  const status = params.get("estado") ?? undefined;
  const priority = params.get("prioridad") ?? undefined;
  const project = params.get("proyecto") ?? undefined;
  const overdue = params.get("vencidas") === "1";
  const search = params.get("buscar") ?? undefined;
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
  const visibleSelected = sorted.filter((task) => selected.has(task.id));

  async function applyBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get("bulk_status") ?? "") as TaskStatus;
    const priority = String(form.get("bulk_priority") ?? "") as TaskPriority;
    const changes = status ? { status } : priority ? { priority } : {};
    if (!status && !priority) return;
    const result = await bulkUpdateTasks(visibleSelected.map((task) => task.id), changes);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`${visibleSelected.length} tareas actualizadas`);
      setSelected(new Set());
      refresh();
    }
  }

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

      {sorted.length > 0 && (
        <form onSubmit={applyBulk} className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-xs">
          <label className="flex items-center gap-2 px-1 text-[12px] font-medium">
            <input
              type="checkbox"
              checked={visibleSelected.length === sorted.length && sorted.length > 0}
              onChange={(event) => setSelected(event.target.checked ? new Set(sorted.map((task) => task.id)) : new Set())}
              className="size-4 accent-[var(--primary)]"
            />
            <CheckSquare className="size-3.5 text-muted-foreground" />
            Seleccionar
          </label>
          <span className="text-[12px] text-muted-foreground">{visibleSelected.length} seleccionadas</span>
          <NativeSelect name="bulk_status" className="ml-auto h-9 w-auto text-xs" defaultValue="">
            <option value="">Cambiar estado</option>
            {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
          </NativeSelect>
          <NativeSelect name="bulk_priority" className="h-9 w-auto text-xs" defaultValue="">
            <option value="">Cambiar prioridad</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </NativeSelect>
          <button type="button" aria-label="Limpiar selección" onClick={() => setSelected(new Set())} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </form>
      )}

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
                  <div key={task.id} className="relative">
                    <label className="absolute left-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-md bg-card/90 shadow-xs ring-1 ring-border/70">
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => setSelected((current) => {
                          const next = new Set(current);
                          if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
                          return next;
                        })}
                        className="size-3.5 accent-[var(--primary)]"
                        aria-label={`Seleccionar ${task.title}`}
                      />
                    </label>
                    <TaskCard
                      task={task}
                      team={data.team}
                      projects={data.projects}
                      isAdmin={isAdmin}
                      onChanged={refresh}
                    />
                  </div>
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
