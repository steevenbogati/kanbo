"use client";

import { Link } from "@/components/app-link";
import { ArrowRight, CalendarClock, CheckCircle2, Inbox, TriangleAlert, Users } from "lucide-react";

import { AdminOnly } from "@/components/auth-provider";
import { fetchTasks, fetchWorkload } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { daysAgoISO, formatDays, todayISO } from "@/lib/dates";
import { ROLE_LABEL, STATUS_DOT, STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { Avatar } from "@/components/user-menu";

/**
 * Stat tile: label, value, and an optional note. The value keeps proportional
 * figures (tabular-nums would look loose at this size); only the columns of
 * numbers further down use `nums`.
 */
function Stat({
  label,
  value,
  note,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  note?: string;
  icon: typeof Inbox;
  tone?: "neutral" | "warning" | "danger" | "good";
}) {
  const accent = {
    neutral: "text-muted-foreground",
    warning: "text-medium",
    danger: "text-high",
    good: "text-done",
  }[tone];

  return (
    <article className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("size-4 shrink-0", accent)} />
      </div>
      <p
        className={cn(
          "mt-2 text-[28px] font-semibold leading-none tracking-tight",
          value > 0 && (tone === "danger" || tone === "warning") ? accent : "text-foreground",
        )}
      >
        {value}
      </p>
      {note && <p className="mt-1.5 text-[12px] text-muted-foreground">{note}</p>}
    </article>
  );
}

/** Meter: severity in the fill, lighter step of the same ramp in the track. */
function Meter({ value, max, tone }: { value: number; max: number; tone: "accent" | "danger" }) {
  const pct = max > 0 ? Math.max(value > 0 ? 6 : 0, Math.round((value / max) * 100)) : 0;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-track" aria-hidden>
      <div
        className={cn("h-full rounded-full", tone === "danger" ? "bg-high" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DashboardContent() {
  const { data, loading, error, refresh } = useData(async () => {
    const [workload, tasks] = await Promise.all([fetchWorkload(), fetchTasks()]);
    return { workload, tasks };
  });

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title="Panel" />;

  const today = todayISO();
  const open = data.tasks.filter((task) => task.status !== "done");
  const overdue = open.filter((task) => task.is_overdue);
  const dueToday = open.filter((task) => task.due_date === today);

  const weekAgo = daysAgoISO(7);
  const deliveredThisWeek = data.tasks.filter(
    (task) => task.status === "done" && task.completed_at && task.completed_at >= weekAgo,
  );

  const durations = data.tasks
    .filter((task) => task.status === "done" && task.duration_days !== null)
    .map((task) => task.duration_days as number);
  const average =
    durations.length > 0 ? durations.reduce((sum, days) => sum + days, 0) / durations.length : null;

  const byStatus = (["backlog", "in_progress", "in_review"] as const).map((status) => ({
    status,
    count: open.filter((task) => task.status === status).length,
  }));

  const busiest = Math.max(1, ...data.workload.map((person) => person.open_tasks));

  return (
    <>
      <PageHeader title="Panel" subtitle="Cómo va el equipo ahora mismo." />

      <div className="space-y-6">
        <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Tareas abiertas" value={open.length} icon={Inbox} />
          <Stat
            label="Vencidas"
            value={overdue.length}
            icon={TriangleAlert}
            tone="danger"
            note={overdue.length > 0 ? "Necesitan atención" : "Todo al día"}
          />
          <Stat label="Vencen hoy" value={dueToday.length} icon={CalendarClock} tone="warning" />
          <Stat
            label="Entregadas esta semana"
            value={deliveredThisWeek.length}
            icon={CheckCircle2}
            tone="good"
            note={average !== null ? `Promedio general: ${formatDays(average)}` : undefined}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
          <section className="rounded-xl border bg-card shadow-xs">
            <header className="flex items-center gap-2 border-b px-4 py-3">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold tracking-tight">Carga por persona</h2>
              <p className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
                La barra compara contra quien tiene más carga
              </p>
            </header>

            <div className="p-4">
              {data.workload.length === 0 ? (
                <EmptyState
                  compact
                  icon={Users}
                  title="Todavía no hay gente activa"
                  hint="Crea las cuentas del equipo para ver su carga aquí."
                />
              ) : (
                <ul className="divide-y">
                  {data.workload.map((person) => (
                    <li key={person.profile_id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={person.full_name} fallback={person.username} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold leading-tight">
                            {person.full_name || person.username}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            @{person.username} · {ROLE_LABEL[person.role]}
                          </p>
                        </div>

                        {person.overdue_tasks > 0 && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-high-soft px-1.5 py-0.5 text-[11px] font-semibold text-high">
                            <TriangleAlert className="size-3" />
                            <span className="nums">{person.overdue_tasks}</span> vencida
                            {person.overdue_tasks === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pl-11">
                        <Meter
                          value={person.open_tasks}
                          max={busiest}
                          tone={person.overdue_tasks > 0 ? "danger" : "accent"}
                        />

                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-4">
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-muted-foreground">Abiertas</dt>
                            <dd className="nums font-semibold">{person.open_tasks}</dd>
                          </div>
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-muted-foreground">En progreso</dt>
                            <dd className="nums font-semibold">{person.in_progress_tasks}</dd>
                          </div>
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-muted-foreground">Entregó (7 días)</dt>
                            <dd className="nums font-semibold">{person.done_last_7_days}</dd>
                          </div>
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-muted-foreground">Entrega promedio</dt>
                            <dd className="nums font-semibold">
                              {formatDays(person.avg_duration_days)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border bg-card shadow-xs">
              <header className="border-b px-4 py-3">
                <h2 className="text-[13px] font-semibold tracking-tight">Abiertas por estado</h2>
              </header>
              <ul className="px-4 py-2">
                {byStatus.map((row) => (
                  <li
                    key={row.status}
                    className="flex items-center gap-2.5 border-b py-2.5 text-[13px] last:border-0"
                  >
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[row.status])}
                    />
                    <span className="flex-1">{STATUS_LABEL[row.status]}</span>
                    <span className="nums font-semibold">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border bg-card shadow-xs">
              <header className="border-b px-4 py-3">
                <h2 className="text-[13px] font-semibold tracking-tight">Atajos</h2>
              </header>
              <div className="flex flex-col px-2 py-2">
                {[
                  { href: "/lista?vencidas=1", label: "Ver todas las tareas vencidas" },
                  { href: "/proyectos", label: "Administrar proyectos y clientes" },
                  { href: "/tablero", label: "Ir al tablero" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-colors duration-150 hover:bg-muted"
                  >
                    {link.label}
                    <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AdminOnly>
      <DashboardContent />
    </AdminOnly>
  );
}
