"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/field";
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import type { Profile, Project, TaskPriority, TaskStatus } from "@/lib/types/database";

/** Filters live in the URL, so a filtered view can be shared or bookmarked. */
export function TaskFilters({
  team,
  projects,
  isAdmin,
}: {
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  // On a phone the filters take up half the screen, so they start folded.
  const [showAll, setShowAll] = useState(false);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/lista?${next.toString()}`);
  }

  /** Human-readable summary of what is filtered right now. */
  const chips: { key: string; label: string }[] = [];

  const assignee = params.get("responsable");
  if (assignee) {
    const person = team.find((member) => member.id === assignee);
    chips.push({
      key: "responsable",
      label: assignee === "sin-responsable" ? "Sin responsable" : person?.full_name || "Responsable",
    });
  }

  const status = params.get("estado");
  if (status) chips.push({ key: "estado", label: STATUS_LABEL[status as TaskStatus] ?? status });

  const priority = params.get("prioridad");
  if (priority) {
    chips.push({
      key: "prioridad",
      label: `Prioridad ${(PRIORITY_LABEL[priority as TaskPriority] ?? priority).toLowerCase()}`,
    });
  }

  const project = params.get("proyecto");
  if (project) {
    const found = projects.find((item) => item.id === project);
    chips.push({
      key: "proyecto",
      label: project === "sin-proyecto" ? "Sin proyecto" : found?.name || "Proyecto",
    });
  }

  const overdue = params.get("vencidas");
  if (overdue) chips.push({ key: "vencidas", label: "Solo vencidas" });

  const search = params.get("buscar");
  if (search) chips.push({ key: "buscar", label: `“${search}”` });

  const selectClass = "h-10 text-[13px]";

  return (
    <div className="mb-5 space-y-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={search ?? "vacio"}
            placeholder="Buscar por título…"
            defaultValue={search ?? ""}
            onChange={(event) => update("buscar", event.target.value)}
            className="h-10 pl-9"
            aria-label="Buscar tareas por título"
          />
        </div>

        <Button
          type="button"
          variant={showAll ? "secondary" : "outline"}
          className="h-10 shrink-0 sm:hidden"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
        >
          <SlidersHorizontal className="size-4" />
          Filtros
        </Button>
      </div>

      <div
        className={cn(
          "gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-5",
          showAll ? "grid" : "hidden sm:grid",
        )}
      >
        {isAdmin && (
          <NativeSelect
            aria-label="Filtrar por responsable"
            className={selectClass}
            value={assignee ?? ""}
            onChange={(event) => update("responsable", event.target.value)}
          >
            <option value="">Todo el equipo</option>
            {team.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name || person.username}
              </option>
            ))}
            <option value="sin-responsable">Sin responsable</option>
          </NativeSelect>
        )}

        <NativeSelect
          aria-label="Filtrar por estado"
          className={selectClass}
          value={status ?? ""}
          onChange={(event) => update("estado", event.target.value)}
        >
          <option value="">Todos los estados</option>
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrar por prioridad"
          className={selectClass}
          value={priority ?? ""}
          onChange={(event) => update("prioridad", event.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {(["high", "medium", "low"] as const).map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABEL[value]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrar por proyecto"
          className={selectClass}
          value={project ?? ""}
          onChange={(event) => update("proyecto", event.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.client_name ? `${item.name} · ${item.client_name}` : item.name}
            </option>
          ))}
          <option value="sin-proyecto">Sin proyecto</option>
        </NativeSelect>

        <Button
          type="button"
          variant={overdue ? "default" : "outline"}
          className="h-10"
          aria-pressed={Boolean(overdue)}
          onClick={() => update("vencidas", overdue ? "" : "1")}
        >
          <TriangleAlert className="size-4" />
          Vencidas
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[12px] text-muted-foreground">Filtrando por</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => update(chip.key, "")}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-secondary pl-2.5 pr-1.5 text-[12px] font-medium text-secondary-foreground transition-colors duration-150 hover:bg-muted"
            >
              {chip.label}
              <X className="size-3.5 text-muted-foreground" />
              <span className="sr-only">Quitar este filtro</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.replace("/lista")}
            className="ml-1 text-[12px] font-medium text-primary underline-offset-2 hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
