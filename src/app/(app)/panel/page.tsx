import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { getTasks, getWorkload } from "@/lib/queries";
import { daysAgoISO, formatDays, todayISO } from "@/lib/dates";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Panel · Kanbo" };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  await requireAdmin();

  const [workload, tasks] = await Promise.all([getWorkload(), getTasks()]);

  const today = todayISO();
  const open = tasks.filter((task) => task.status !== "done");
  const overdue = open.filter((task) => task.is_overdue);
  const dueToday = open.filter((task) => task.due_date === today);

  const weekAgo = daysAgoISO(7);
  const deliveredThisWeek = tasks.filter(
    (task) => task.status === "done" && task.completed_at && task.completed_at >= weekAgo,
  );

  const durations = tasks
    .filter((task) => task.status === "done" && task.duration_days !== null)
    .map((task) => task.duration_days as number);
  const average =
    durations.length > 0 ? durations.reduce((sum, days) => sum + days, 0) / durations.length : null;

  const byStatus = (["backlog", "in_progress", "in_review"] as const).map((status) => ({
    status,
    count: open.filter((task) => task.status === status).length,
  }));

  return (
    <>
      <PageHeader title="Panel" subtitle="Cómo va el equipo ahora mismo." />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Tareas abiertas" value={String(open.length)} />
          <Stat
            label="Vencidas"
            value={String(overdue.length)}
            hint={overdue.length > 0 ? "Necesitan atención" : "Todo al día"}
          />
          <Stat label="Vencen hoy" value={String(dueToday.length)} />
          <Stat
            label="Entregadas esta semana"
            value={String(deliveredThisWeek.length)}
            hint={average !== null ? `Promedio: ${formatDays(average)}` : undefined}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Carga por persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload.map((person) => (
              <div key={person.profile_id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="font-medium">{person.full_name || person.email}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[person.role]}</p>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Abiertas</dt>
                    <dd className="tabular-nums">{person.open_tasks}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">En progreso</dt>
                    <dd className="tabular-nums">{person.in_progress_tasks}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Vencidas</dt>
                    <dd
                      className={
                        person.overdue_tasks > 0
                          ? "tabular-nums text-red-600 dark:text-red-400"
                          : "tabular-nums"
                      }
                    >
                      {person.overdue_tasks}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Entrega promedio</dt>
                    <dd className="tabular-nums">{formatDays(person.avg_duration_days)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-muted-foreground">
                  Entregadas en los últimos 7 días: {person.done_last_7_days}
                </p>
              </div>
            ))}
            {workload.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no hay gente activa.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abiertas por estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <span>{STATUS_LABEL[row.status]}</span>
                  <span className="tabular-nums">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atajos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href="/lista?vencidas=1" className="block underline underline-offset-2">
                Ver todas las tareas vencidas
              </Link>
              <Link href="/proyectos" className="block underline underline-offset-2">
                Administrar proyectos y clientes
              </Link>
              <Link href="/tablero" className="block underline underline-offset-2">
                Ir al tablero
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
