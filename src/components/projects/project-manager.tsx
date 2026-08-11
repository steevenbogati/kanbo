"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, FolderOpen, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { EmptyState } from "@/components/empty-state";
import { idleState } from "@/lib/action-state";
import { createProject, setProjectArchived } from "@/app/actions/projects";
import type { Project } from "@/lib/types/database";

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-11" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Agregar
    </Button>
  );
}

function ProjectRow({
  project,
  onToggle,
  archived,
}: {
  project: Project;
  onToggle: () => void;
  archived: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${archived ? "opacity-65" : ""}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FolderOpen className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-tight">{project.name}</p>
        <p className="truncate text-[12px] text-muted-foreground">
          {project.client_name || "Sin cliente"}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        aria-label={`${archived ? "Recuperar" : "Archivar"} ${project.name}`}
      >
        {archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
        {archived ? "Recuperar" : "Archivar"}
      </Button>
    </li>
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
      else {
        toast.success(project.is_archived ? "Proyecto recuperado" : "Proyecto archivado");
        router.refresh();
      }
    });
  }

  const active = projects.filter((project) => !project.is_archived);
  const archived = projects.filter((project) => project.is_archived);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-xl border bg-card shadow-xs">
        <header className="border-b px-4 py-3">
          <h2 className="text-[13px] font-semibold tracking-tight">Nuevo proyecto</h2>
        </header>

        <form ref={formRef} action={formAction} className="space-y-4 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="name">
              <Input
                id="name"
                name="name"
                placeholder="Ej. Rediseño web"
                className="h-11 text-base"
                maxLength={60}
                required
              />
            </Field>
            <Field label="Cliente" htmlFor="client_name" hint="Opcional.">
              <Input
                id="client_name"
                name="client_name"
                placeholder="Ej. Bogati"
                className="h-11 text-base"
                maxLength={60}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <CreateButton />
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-card shadow-xs">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-[13px] font-semibold tracking-tight">Proyectos activos</h2>
          <span className="nums rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {active.length}
          </span>
        </header>

        <div className="px-4 py-4">
          {active.length === 0 ? (
            <EmptyState
              compact
              icon={FolderOpen}
              title="Todavía no hay proyectos"
              hint="Sirven para agrupar tareas por cliente y filtrarlas después."
            />
          ) : (
            <ul className="divide-y">
              {active.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  archived={false}
                  onToggle={() => toggleArchive(project)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {archived.length > 0 && (
        <section className="rounded-xl border bg-card shadow-xs">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-[13px] font-semibold tracking-tight">Archivados</h2>
            <span className="nums rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {archived.length}
            </span>
          </header>
          <div className="px-4 py-4">
            <ul className="divide-y">
              {archived.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  archived
                  onToggle={() => toggleArchive(project)}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
        Al archivar un proyecto deja de aparecer al crear tareas, pero las tareas que ya lo usan no
        se tocan.
      </p>
    </div>
  );
}
