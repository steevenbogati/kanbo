"use client";

import { useRef, useState } from "react";
import { ClipboardList, Loader2, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminOnly, useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/field";
import { createTaskFromTemplate, createTemplate, deleteTemplate, fetchProjects, fetchTemplates } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { PRIORITY_LABEL, RECURRENCE_LABEL } from "@/lib/labels";
import type { Project, TaskTemplate } from "@/lib/types/database";

function TemplateManager({ templates, projects, onChanged }: { templates: TaskTemplate[]; projects: Project[]; onChanged: () => void }) {
  const { userId } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    setPending(true);
    const result = await createTemplate({
      name: text("name"), title: text("title"), description: text("description"),
      priority: text("priority") as TaskTemplate["priority"],
      project_id: text("project_id") || null,
      recurrence: text("recurrence") as TaskTemplate["recurrence"],
      estimated_hours: Number(text("estimated_hours") || 0),
    }, userId);
    setPending(false);
    if (result.error) toast.error(result.error);
    else { formRef.current?.reset(); toast.success("Plantilla guardada"); onChanged(); }
  }

  async function createFromTemplate(template: TaskTemplate) {
    const result = await createTaskFromTemplate(template, userId, null);
    if (result.error) toast.error(result.error); else toast.success("Tarea creada desde la plantilla");
  }

  async function remove(template: TaskTemplate) {
    const result = await deleteTemplate(template.id);
    if (result.error) toast.error(result.error); else { toast.success("Plantilla borrada"); onChanged(); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
      <section className="rounded-xl border bg-card shadow-xs">
        <header className="border-b px-4 py-3"><h2 className="text-[13px] font-semibold">Nueva plantilla</h2></header>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4 px-4 py-4">
          <Field label="Nombre interno" htmlFor="name"><Input id="name" name="name" required maxLength={60} className="h-10" placeholder="Ej. Reel semanal" /></Field>
          <Field label="Título de la tarea" htmlFor="title"><Input id="title" name="title" required maxLength={120} className="h-10" placeholder="Ej. Editar video de la semana" /></Field>
          <Field label="Descripción" htmlFor="description"><Textarea id="description" name="description" rows={3} className="resize-y" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridad" htmlFor="priority"><NativeSelect id="priority" name="priority" defaultValue="medium"><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></NativeSelect></Field>
            <Field label="Horas" htmlFor="estimated_hours"><Input id="estimated_hours" name="estimated_hours" type="number" min="0" step="0.25" defaultValue="0" className="h-10" /></Field>
          </div>
          <Field label="Proyecto" htmlFor="project_id"><NativeSelect id="project_id" name="project_id" defaultValue=""><option value="">Sin proyecto</option>{projects.filter((p) => !p.is_archived).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</NativeSelect></Field>
          <Field label="Repetición" htmlFor="recurrence"><NativeSelect id="recurrence" name="recurrence" defaultValue="none">{Object.entries(RECURRENCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></Field>
          <Button type="submit" className="h-10 w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Guardar plantilla</Button>
        </form>
      </section>

      <section className="rounded-xl border bg-card shadow-xs">
        <header className="flex items-center justify-between border-b px-4 py-3"><h2 className="text-[13px] font-semibold">Plantillas guardadas</h2><span className="nums rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{templates.length}</span></header>
        <div className="p-4">
          {templates.length === 0 ? <EmptyState compact icon={ClipboardList} title="Todavía no hay plantillas" hint="Guarda el trabajo repetitivo una sola vez." /> : (
            <ul className="divide-y">
              {templates.map((template) => (
                <li key={template.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><ClipboardList className="size-4" /></span>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{template.name}</p><p className="truncate text-[12px] text-muted-foreground">{template.title} · {PRIORITY_LABEL[template.priority]}</p></div>
                  <Button variant="outline" size="sm" onClick={() => void createFromTemplate(template)}><Play className="size-3.5" /> Usar</Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Borrar ${template.name}`} onClick={() => void remove(template)}><Trash2 className="size-3.5" /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function TemplatesContent() {
  const { data, loading, error, refresh } = useData(async () => {
    const [templates, projects] = await Promise.all([fetchTemplates(), fetchProjects(true)]);
    return { templates, projects };
  });
  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title="Plantillas" />;
  return <><PageHeader eyebrow="Administración" title="Plantillas" subtitle="Crea tareas repetitivas en segundos." /><TemplateManager templates={data.templates} projects={data.projects} onChanged={refresh} /></>;
}

export default function TemplatesPage() { return <AdminOnly><TemplatesContent /></AdminOnly>; }
