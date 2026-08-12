"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

/**
 * A row of tasks that slides sideways, with arrows on desktop and a finger
 * swipe on the phone. Used instead of stacking dozens of cards vertically.
 */
export function TaskRail({
  title,
  hint,
  tasks,
  team,
  projects,
  isAdmin,
  onChanged,
  accent,
}: {
  title: string;
  hint?: string;
  tasks: TaskOverview[];
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
  onChanged: () => void;
  accent?: "danger";
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function slide(direction: -1 | 1) {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: "smooth" });
  }

  if (tasks.length === 0) return null;

  return (
    <section className="min-w-0">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
            {title}
            <span
              className={`nums rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                accent === "danger" ? "bg-high-soft text-high" : "bg-muted text-muted-foreground"
              }`}
            >
              {tasks.length}
            </span>
          </h2>
          {hint && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</p>}
        </div>

        {tasks.length > 1 && (
          <div className="hidden shrink-0 gap-1.5 sm:flex">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full bg-card"
              aria-label={`Ver anteriores de ${title}`}
              onClick={() => slide(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full bg-card"
              aria-label={`Ver siguientes de ${title}`}
              onClick={() => slide(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </header>

      <div
        ref={scroller}
        className="rail-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
      >
        {tasks.map((task) => (
          <div key={task.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
            <TaskCard
              task={task}
              team={team}
              projects={projects}
              isAdmin={isAdmin}
              onChanged={onChanged}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
