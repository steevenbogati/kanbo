"use client";

import { ArrowRight, CalendarClock, CheckCircle2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Link } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dueLabel, formatDate } from "@/lib/dates";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/labels";
import { moveTask } from "@/lib/data";
import type { TaskOverview } from "@/lib/types/database";

/**
 * The banner at the top of Mi día: the one task that matters most right now.
 * There are no cover images in a task app, so the weight comes from type,
 * a tinted wash and a dotted texture instead of a photo.
 */
export function HeroTask({
  task,
  open,
  doneThisWeek,
  onChanged,
}: {
  task: TaskOverview;
  open: number;
  doneThisWeek: number;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const due = dueLabel(task.due_date);
  const total = open + doneThisWeek;
  const progress = total > 0 ? Math.round((doneThisWeek / total) * 100) : 0;

  const next = task.status === "backlog" ? "in_progress" : task.status === "in_progress" ? "in_review" : "done";

  async function advance() {
    setPending(true);
    const result = await moveTask(task.id, next);
    setPending(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success(`Movida a ${STATUS_LABEL[next]}`);
      onChanged();
    }
  }

  return (
    <section
      aria-label="Lo más urgente"
      // Fixed dark banner in both themes: inverting it in dark mode washed it out.
      className="relative overflow-hidden rounded-[22px] bg-[oklch(0.24_0.04_282)] text-white shadow-md"
    >
      {/* Wash + texture, so it reads as a banner and not a flat block. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 140% at 100% 0%, oklch(0.62 0.18 18 / 0.95) 0%, transparent 58%), radial-gradient(90% 120% at 0% 100%, oklch(0.5 0.13 296 / 0.8) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="dotted absolute inset-0 text-white/10" />

      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="min-w-0 max-w-xl">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">
            {task.is_overdue ? (
              <>
                <TriangleAlert className="size-3.5" />
                Lo más atrasado
              </>
            ) : (
              <>
                <CalendarClock className="size-3.5" />
                Lo primero de hoy
              </>
            )}
          </p>

          <h2 className="mt-2.5 text-[26px] font-semibold leading-tight tracking-tight md:text-[32px]">
            {task.title}
          </h2>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/85">
            <span>{task.project_name ?? "Sin proyecto"}</span>
            <span aria-hidden>·</span>
            <span>Prioridad {PRIORITY_LABEL[task.priority].toLowerCase()}</span>
            <span aria-hidden>·</span>
            <span className={cn(task.is_overdue && "font-semibold")}>
              {/* "Vence en 3 días" already says it; only a far-off date needs
                  the day spelled out, and dueLabel returns that one itself. */}
              {due.tone === "soon" || due.tone === "today"
                ? `${due.text} · ${formatDate(task.due_date)}`
                : due.text}
            </span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              className="h-11 rounded-xl bg-white px-4 text-[13.5px] font-semibold text-[oklch(0.24_0.04_282)] hover:bg-white/90"
              disabled={pending}
              onClick={() => void advance()}
            >
              {next === "done" ? <CheckCircle2 className="size-4" /> : <ArrowRight className="size-4" />}
              {next === "in_progress"
                ? "Empezar ahora"
                : next === "in_review"
                  ? "Mandar a revisión"
                  : "Marcar hecha"}
            </Button>

            <Button
              variant="ghost"
              nativeButton={false}
              className="h-11 rounded-xl px-4 text-[13.5px] font-semibold text-white hover:bg-white/15"
              render={<Link href={`/tarea?id=${task.id}`} />}
            >
              Ver detalle
            </Button>
          </div>
        </div>

        {/* Week progress, as a quiet meter instead of a chart. */}
        <div className="w-full shrink-0 md:w-[248px]">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[12px] text-white/80">Tu semana</p>
            <p className="nums text-[12px] font-semibold text-white">
              {doneThisWeek} de {total}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-white/75">
            {doneThisWeek === 0
              ? "Todavía no entregas nada esta semana."
              : `Llevas ${progress}% entregado esta semana.`}
          </p>
        </div>
      </div>
    </section>
  );
}
