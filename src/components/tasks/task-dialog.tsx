"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { idleState } from "@/lib/action-state";
import { createTask, updateTask } from "@/app/actions/tasks";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {isNew ? "Crear tarea" : "Guardar cambios"}
    </Button>
  );
}

export function TaskDialog({
  task,
  team,
  projects,
  isAdmin,
  trigger,
  defaultStatus,
  open: controlledOpen,
  onOpenChange,
}: {
  task?: TaskOverview;
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
  trigger?: React.ReactNode;
  defaultStatus?: string;
  /** Optional: lets a parent (a menu item, for example) open the dialog. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isNew = !task;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [state, formAction] = useActionState(isNew ? createTask : updateTask, idleState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success(isNew ? "Tarea creada" : "Cambios guardados");
      router.refresh();
    }
    // setOpen is stable in both the controlled and uncontrolled case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isNew, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nueva tarea" : "Editar tarea"}</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Completa lo que sepas. Solo el título es obligatorio."
              : "Puedes editar tu tarea. El responsable lo asigna el administrador."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {task && <input type="hidden" name="id" value={task.id} />}

          <Field label="Título" htmlFor="title">
            <Input
              id="title"
              name="title"
              defaultValue={task?.title ?? ""}
              placeholder="Ej. Editar video del cliente"
              required
              autoFocus
            />
          </Field>

          <Field label="Descripción" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
              placeholder="Detalles, instrucciones, lo que haga falta."
            />
          </Field>

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
                      {person.full_name || person.email}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}

            <Field label="Proyecto o cliente" htmlFor="project_id">
              <NativeSelect id="project_id" name="project_id" defaultValue={task?.project_id ?? ""}>
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.client_name ? `${project.name} · ${project.client_name}` : project.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Prioridad" htmlFor="priority">
              <NativeSelect id="priority" name="priority" defaultValue={task?.priority ?? "medium"}>
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
              <Input id="due_date" name="due_date" type="date" defaultValue={task?.due_date ?? ""} />
            </Field>

            <Field label="Se repite" htmlFor="recurrence">
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
            />
          </Field>

          {state.error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <SaveButton isNew={isNew} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
