"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/field";
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import type { Profile, Project } from "@/lib/types/database";

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

  const hasFilters = Array.from(params.keys()).length > 0;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por título…"
          defaultValue={params.get("buscar") ?? ""}
          onChange={(event) => update("buscar", event.target.value)}
        />
        <Button
          type="button"
          variant={showAll ? "secondary" : "outline"}
          size="lg"
          className="shrink-0 sm:hidden"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
        >
          <SlidersHorizontal className="size-4" />
          Filtros
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-2 sm:grid-cols-2 lg:grid-cols-5",
          showAll ? "grid" : "hidden sm:grid",
        )}
      >
        {isAdmin && (
          <NativeSelect
            aria-label="Responsable"
            value={params.get("responsable") ?? ""}
            onChange={(event) => update("responsable", event.target.value)}
          >
            <option value="">Todo el equipo</option>
            {team.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name || person.email}
              </option>
            ))}
            <option value="sin-responsable">Sin responsable</option>
          </NativeSelect>
        )}

        <NativeSelect
          aria-label="Estado"
          value={params.get("estado") ?? ""}
          onChange={(event) => update("estado", event.target.value)}
        >
          <option value="">Todos los estados</option>
          {STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Prioridad"
          value={params.get("prioridad") ?? ""}
          onChange={(event) => update("prioridad", event.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {(["high", "medium", "low"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Proyecto"
          value={params.get("proyecto") ?? ""}
          onChange={(event) => update("proyecto", event.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.client_name
                ? `${project.name} · ${project.client_name}`
                : project.name}
            </option>
          ))}
          <option value="sin-proyecto">Sin proyecto</option>
        </NativeSelect>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={params.get("vencidas") ? "default" : "outline"}
            size="lg"
            className="flex-1"
            onClick={() =>
              update("vencidas", params.get("vencidas") ? "" : "1")
            }
          >
            Vencidas
          </Button>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Quitar filtros"
              onClick={() => router.replace("/lista")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
