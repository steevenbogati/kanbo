"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { Link } from "@/components/app-link";
import { fetchTasks } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { STATUS_DOT, STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function isoForDay(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const { data: tasks, loading, error, refresh } = useData(fetchTasks, []);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric" }).format(cursor);
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks ?? []) {
      if (!task.due_date) continue;
      map.set(task.due_date, [...(map.get(task.due_date) ?? []), task]);
    }
    return map;
  }, [tasks]);

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !tasks) return <PageSkeleton title="Calendario" />;

  return (
    <>
      <PageHeader
        eyebrow="Trabajo"
        title="Calendario"
        subtitle="Mira las entregas del equipo por fecha."
        action={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" aria-label="Mes anterior" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon-sm" aria-label="Mes siguiente" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="size-4" /></Button>
          </div>
        }
      />

      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <header className="border-b px-4 py-3">
          <h2 className="capitalize text-[14px] font-semibold">{monthLabel}</h2>
        </header>
        <div className="grid grid-cols-7 border-b bg-muted/35">
          {WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstWeekday }).map((_, index) => <div key={`blank-${index}`} className="min-h-28 border-b border-r bg-muted/10 sm:min-h-36" />)}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            const iso = isoForDay(year, month, day);
            const dayTasks = tasksByDate.get(iso) ?? [];
            const isToday = iso === new Date().toISOString().slice(0, 10);
            return (
              <div key={iso} className="min-h-28 border-b border-r p-1.5 sm:min-h-36 sm:p-2">
                <span className={cn("mb-1 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold", isToday && "bg-primary text-primary-foreground")}>{day}</span>
                <div className="space-y-1">
                  {dayTasks.slice(0, 4).map((task) => (
                    <Link key={task.id} href={`/tarea?id=${task.id}`} className="block rounded-md bg-muted/55 px-1.5 py-1 text-[10px] leading-tight transition-colors hover:bg-accent sm:text-[11px]">
                      <span className="flex items-start gap-1">
                        <span className={cn("mt-0.5 size-1.5 shrink-0 rounded-full", STATUS_DOT[task.status])} />
                        <span className="line-clamp-2">{task.title}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{STATUS_LABEL[task.status]}</span>
                    </Link>
                  ))}
                  {dayTasks.length > 4 && <p className="px-1 text-[10px] text-muted-foreground">+{dayTasks.length - 4} más</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {tasks.every((task) => !task.due_date) && <div className="mt-5"><EmptyState icon={CalendarDays} title="No hay fechas de entrega" hint="Agrega una fecha a una tarea para verla aquí." /></div>}
    </>
  );
}
