"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/field";
import { PRIORITY_LABEL, RECURRENCE_LABEL, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { useAuth } from "@/components/auth-provider";
import { createTask, updateTask, type TaskInput } from "@/lib/data";
import type {
  Profile,
  Project,
  RecurrenceKind,
  TaskOverview,
  TaskPriority,
  TaskStatus,
} from "@/lib/types/database";

export function TaskDialog({
  task,
  team,
  projects,
  trigger,
  defaultStatus,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: {
  task?: TaskOverview;
  team: Profile[];
  projects: Project[];
  trigger?: React.ReactNode;
  defaultStatus?: TaskStatus;
  /** Optional: lets a parent (a menu item, for example) open the dialog. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { userId, isAdmin } = useAuth();
  const isNew = !task;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const text = (key: string) => String(form.get(key) ?? "").trim();
    const optional = (key: string) => text(key) || null;

    const title = text("title");
    if (!title) {
      setError("La tarea necesita un título.");
      return;
    }

    const externalUrl = optional("external_url");
    if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
      setError("El enlace debe empezar con http:// o https://");
      return;
    }

    const input: TaskInput = {
      title,
      description: text("description"),
      // A member can only work on their own tasks; only the admin picks people.
      assignee_id: isAdmin ? optional("assignee_id") : (task?.assignee_id ?? userId),
      project_id: optional("project_id"),
      priority: text("priority") as TaskPriority,
      status: text("status") as TaskStatus,
      due_date: optional("due_date"),
      external_url: externalUrl,
      recurrence: text("recurrence") as RecurrenceKind,
      estimated_hours: Number(text("estimated_hours") || 0),
    };

    setPending(true);
    setError(null);

    const result = task
      ? await updateTask(task.id, isAdmin ? input : { ...input, assignee_id: task.assignee_id })
      : await createTask(input, userId);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    toast.success(isNew ? "Tarea creada" : "Cambios guardados");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}

      <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-[17px]">
            {isNew ? "Nueva tarea" : "Editar tarea"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Solo el título es obligatorio; el resto lo puedes completar después."
              : isNew
                ? "Queda a tu nombre: los miembros solo crean tareas para sí mismos."
                : "Puedes editar tu tarea. El responsable lo asigna el administrador."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-5 px-5 py-5">
            <Field label="Título" htmlFor="title">
              <Input
                id="title"
                name="title"
                defaultValue={task?.title ?? ""}
                placeholder="Ej. Editar el video del cliente"
                className="h-11 text-base"
                maxLength={120}
                required
                autoFocus
              />
            </Field>

            <Field label="Descripción" htmlFor="description" hint="Opcional.">
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={task?.description ?? ""}
                placeholder="Detalles, instrucciones, lo que haga falta."
                className="resize-y text-base"
              />
            </Field>

            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {isAdmin && (
                  <Field label="Responsable" htmlFor="assignee_id">
                    <NativeSelect
                      id="assignee_id"
                      name="assignee_id"
                      defaultValue={task?.assignee_id ?? ""}
                    >
                      <option value="">Sin responsable</option>
                      {team.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.full_name || person.username}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}

                <Field label="Proyecto o cliente" htmlFor="project_id">
                  <NativeSelect
                    id="project_id"
                    name="project_id"
                    defaultValue={task?.project_id ?? ""}
                  >
                    <option value="">Sin proyecto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.client_name
                          ? `${project.name} · ${project.client_name}`
                          : project.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field label="Prioridad" htmlFor="priority">
                  <NativeSelect
                    id="priority"
                    name="priority"
                    defaultValue={task?.priority ?? "medium"}
                  >
                    {(["high", "medium", "low"] as const).map((value) => (
                      <option key={value} value={value}>
                        {PRIORITY_LABEL[value]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field label="Estado" htmlFor="status">
                  <NativeSelect
                    id="status"
                    name="status"
                    defaultValue={task?.status ?? defaultStatus ?? "backlog"}
                  >
                    {STATUS_ORDER.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABEL[value]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field label="Fecha de entrega" htmlFor="due_date">
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    defaultValue={task?.due_date ?? ""}
                    className="h-11"
                  />
                </Field>

                <Field label="Horas estimadas" htmlFor="estimated_hours" hint="Opcional. Sirve para medir carga y costo.">
                  <Input
                    id="estimated_hours"
                    name="estimated_hours"
                    type="number"
                    min="0"
                    max="9999"
                    step="0.25"
                    defaultValue={task?.estimated_hours ?? 0}
                    className="h-11"
                  />
                </Field>

                <Field
                  label="Se repite"
                  htmlFor="recurrence"
                  hint="Al marcarla hecha, nace la siguiente."
                >
                  <NativeSelect
                    id="recurrence"
                    name="recurrence"
                    defaultValue={task?.recurrence ?? "none"}
                  >
                    {(["none", "daily", "weekly", "monthly"] as const).map((value) => (
                      <option key={value} value={value}>
                        {RECURRENCE_LABEL[value]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            </div>

            <Field
              label="Enlace externo"
              htmlFor="external_url"
              hint="Drive, Figma, repositorio… lo que se necesite abrir."
            >
              <Input
                id="external_url"
                name="external_url"
                type="url"
                inputMode="url"
                placeholder="https://…"
                defaultValue={task?.external_url ?? ""}
                className="h-11 text-base"
              />
            </Field>

            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg bg-high-soft px-3 py-2.5 text-sm text-high"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-b-xl px-5 py-4">
            <DialogClose
              render={<Button type="button" variant="outline" className="h-11 sm:h-10" />}
            >
              Cancelar
            </DialogClose>
            <Button type="submit" className="h-11 sm:h-10" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isNew ? "Crear tarea" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
