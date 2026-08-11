"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/field";
import { idleState } from "@/lib/action-state";
import { createProject, setProjectArchived } from "@/app/actions/projects";
import type { Project } from "@/lib/types/database";

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Agregar
    </Button>
  );
}

export function ProjectManager({ projects }: { projects: Project[] }) {
  const [state, formAction] = useActionState(createProject, idleState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      toast.success("Proyecto creado");
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  function toggleArchive(project: Project) {
    startTransition(async () => {
      const result = await setProjectArchived(project.id, !project.is_archived);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  const active = projects.filter((project) => !project.is_archived);
  const archived = projects.filter((project) => project.is_archived);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Nombre" htmlFor="name">
              <Input id="name" name="name" placeholder="Ej. Rediseño web" required />
            </Field>
            <Field label="Cliente" htmlFor="client_name">
              <Input id="client_name" name="client_name" placeholder="Ej. Bogati" />
            </Field>
            <div className="flex items-end">
              <CreateButton />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proyectos activos ({active.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {active.map((project) => (
            <div key={project.id} className="flex items-center gap-2 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{project.name}</p>
                {project.client_name && (
                  <p className="truncate text-xs text-muted-foreground">{project.client_name}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleArchive(project)}
                aria-label={`Archivar ${project.name}`}
              >
                <Archive className="size-3.5" />
                Archivar
              </Button>
            </div>
          ))}
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay proyectos.</p>
          )}
        </CardContent>
      </Card>

      {archived.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archivados ({archived.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archived.map((project) => (
              <div key={project.id} className="flex items-center gap-2 rounded-lg border p-3 opacity-70">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{project.name}</p>
                  {project.client_name && (
                    <p className="truncate text-xs text-muted-foreground">{project.client_name}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleArchive(project)}>
                  <ArchiveRestore className="size-3.5" />
                  Recuperar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Al archivar un proyecto deja de aparecer al crear tareas, pero las tareas que ya lo usan no
        se tocan.
      </p>
    </div>
  );
}
