"use client";

import { useRef, useState } from "react";
import {
  CalendarPlus,
  Check,
  GitBranch,
  ListChecks,
  MessageCircle,
  Play,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/field";
import { cn } from "@/lib/utils";
import {
  addChecklistItem,
  addDependency,
  deleteChecklistItem,
  fetchChecklist,
  fetchDependencies,
  fetchTimeEntries,
  removeDependency,
  startTimeEntry,
  stopTimeEntry,
  toggleChecklistItem,
} from "@/lib/data";
import { useData } from "@/lib/use-data";
import { formatDateTime } from "@/lib/dates";
import { STATUS_CHIP, STATUS_LABEL } from "@/lib/labels";
import type { TaskOverview } from "@/lib/types/database";

function ToolPanel({ title, icon: Icon, children }: { title: string; icon: typeof ListChecks; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export function TaskTools({ task, availableTasks, onChanged }: { task: TaskOverview; availableTasks: TaskOverview[]; onChanged: () => void }) {
  const { userId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const { data, loading, refresh } = useData(
    async () => {
      const [checklist, timeEntries, dependencies] = await Promise.all([
        fetchChecklist(task.id),
        fetchTimeEntries(task.id),
        fetchDependencies(task.id),
      ]);
      return { checklist, timeEntries, dependencies };
    },
    [task.id],
  );

  const active = data?.timeEntries.find((entry) => entry.user_id === userId && !entry.stopped_at);
  const completedCount = data?.checklist.filter((item) => item.is_done).length ?? 0;
  const dependencyOptions = availableTasks.filter(
    (candidate) => candidate.id !== task.id && !data?.dependencies.some((item) => item.depends_on_id === candidate.id),
  );

  async function run(action: () => Promise<{ error: string | null }>, success: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(success);
      refresh();
      onChanged();
    }
  }

  function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = String(new FormData(event.currentTarget).get("checklist") ?? "");
    void run(() => addChecklistItem(task.id, userId, label), "Punto agregado").then(() => inputRef.current?.focus());
    event.currentTarget.reset();
  }

  function addBlocker(event: React.ChangeEvent<HTMLSelectElement>) {
    const dependsOnId = event.target.value;
    if (!dependsOnId) return;
    event.target.value = "";
    void run(() => addDependency(task.id, dependsOnId, userId), "Bloqueo agregado");
  }

  function calendarUrl() {
    const start = (task.due_date ?? new Date().toISOString().slice(0, 10)).replaceAll("-", "");
    const endDate = new Date(`${task.due_date ?? new Date().toISOString().slice(0, 10)}T12:00:00`);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().slice(0, 10).replaceAll("-", "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&dates=${start}/${end}&details=${encodeURIComponent(task.description)}`;
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${task.title}${task.due_date ? ` · entrega ${task.due_date}` : ""}`)}`;

  return (
    <div className="space-y-4">
      <ToolPanel title={`Checklist${completedCount > 0 || data?.checklist.length ? ` (${completedCount}/${data?.checklist.length})` : ""}`} icon={ListChecks}>
        {loading ? (
          <p className="text-[13px] text-muted-foreground">Cargando checklist.</p>
        ) : (
          <>
            {data?.checklist.length ? (
              <ul className="space-y-2">
                {data.checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={item.is_done ? "Marcar pendiente" : "Marcar hecho"}
                      onClick={() => void run(() => toggleChecklistItem(item.id, !item.is_done), item.is_done ? "Punto pendiente" : "Punto completado")}
                      className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors", item.is_done ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary")}
                    >
                      {item.is_done && <Check className="size-3.5" />}
                    </button>
                    <span className={cn("min-w-0 flex-1 text-[13px]", item.is_done && "text-muted-foreground line-through")}>{item.label}</span>
                    <Button variant="ghost" size="icon-xs" aria-label="Borrar punto" className="opacity-0 group-hover:opacity-100" onClick={() => void run(() => deleteChecklistItem(item.id), "Punto borrado")}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">Divide el trabajo en pasos pequeños.</p>
            )}
            <form onSubmit={addItem} className="mt-3 flex gap-2 border-t pt-3">
              <Input ref={inputRef} name="checklist" placeholder="Añadir un paso" className="h-9" maxLength={120} />
              <Button type="submit" variant="outline" size="icon-sm" aria-label="Añadir paso" disabled={pending}><Plus className="size-4" /></Button>
            </form>
          </>
        )}
      </ToolPanel>

      <ToolPanel title="Tiempo real" icon={Play}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">{active ? "Contador activo" : "¿Cuánto te tomó?"}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Registra horas reales para mejorar estimaciones.</p>
          </div>
          {active ? (
            <Button variant="outline" className="h-9" disabled={pending} onClick={() => void run(() => stopTimeEntry(active.id), "Tiempo detenido")}><Square className="size-3.5" /> Detener</Button>
          ) : (
            <Button className="h-9" disabled={pending} onClick={() => void run(() => startTimeEntry(task.id, userId), "Contador iniciado")}><Play className="size-3.5" /> Iniciar</Button>
          )}
        </div>
        {data?.timeEntries.length ? (
          <ul className="mt-3 space-y-1.5 border-t pt-3">
            {data.timeEntries.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex justify-between gap-2 text-[11px] text-muted-foreground">
                <span>{formatDateTime(entry.started_at)}</span>
                <span>{entry.stopped_at ? formatDateTime(entry.stopped_at) : "En curso"}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </ToolPanel>

      <ToolPanel title="Bloqueos" icon={GitBranch}>
        {data?.dependencies.length ? (
          <ul className="space-y-2">
            {data.dependencies.map((dependency) => {
              const blocked = availableTasks.find((candidate) => candidate.id === dependency.depends_on_id);
              return (
                <li key={dependency.depends_on_id} className="flex items-center gap-2 text-[13px]">
                  <span className="min-w-0 flex-1 truncate">{blocked?.title ?? "Tarea bloqueante"}</span>
                  {blocked && <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", STATUS_CHIP[blocked.status])}>{STATUS_LABEL[blocked.status]}</span>}
                  <Button variant="ghost" size="icon-xs" aria-label="Quitar bloqueo" onClick={() => void run(() => removeDependency(task.id, dependency.depends_on_id), "Bloqueo quitado")}><Trash2 className="size-3.5" /></Button>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-[13px] text-muted-foreground">Ninguna tarea bloquea esta entrega.</p>}
        {dependencyOptions.length > 0 && (
          <NativeSelect className="mt-3 h-9 text-xs" defaultValue="" onChange={addBlocker}>
            <option value="">Añadir tarea bloqueante</option>
            {dependencyOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
          </NativeSelect>
        )}
      </ToolPanel>

      <ToolPanel title="Compartir e integrar" icon={MessageCircle}>
        <div className="flex flex-wrap gap-2">
          {task.due_date && <Button variant="outline" className="h-9" nativeButton={false} render={<a href={calendarUrl()} target="_blank" rel="noopener noreferrer" />}><CalendarPlus className="size-3.5" /> Google Calendar</Button>}
          <Button variant="outline" className="h-9" nativeButton={false} render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}><MessageCircle className="size-3.5" /> WhatsApp</Button>
          {task.external_url && <Button variant="outline" className="h-9" nativeButton={false} render={<a href={task.external_url} target="_blank" rel="noopener noreferrer" />}><GitBranch className="size-3.5" /> Abrir enlace</Button>}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Los enlaces se abren con tu cuenta. No guardamos contraseñas de Google, Drive, Slack ni GitHub.</p>
      </ToolPanel>
    </div>
  );
}
