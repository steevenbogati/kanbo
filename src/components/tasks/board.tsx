"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_EMPTY, STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { sortTasks } from "@/lib/task-order";
import { moveTask } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { Profile, Project, TaskOverview, TaskStatus } from "@/lib/types/database";

/**
 * The drop target follows the pointer, not the card's rectangle: while dragging,
 * the card still overlaps its own column, which would otherwise win.
 * closestCorners is the fallback used when dragging with the keyboard.
 */
const collisionDetection: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  return byPointer.length > 0 ? byPointer : closestCorners(args);
};

type Shared = {
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
  onChanged: () => void;
};

function DraggableCard({ task, ...shared }: { task: TaskOverview } & Shared) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div ref={setNodeRef}>
      <TaskCard
        task={task}
        {...shared}
        dragHandle={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

function Column({
  status,
  tasks,
  ...shared
}: { status: TaskStatus; tasks: TaskOverview[] } & Shared) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABEL[status]}
      className={cn(
        "flex w-[84vw] shrink-0 snap-start flex-col rounded-[20px] border border-border/70 bg-panel/60 transition-colors duration-150 sm:w-[300px] md:w-full md:min-h-[460px]",
        isOver && "border-primary/45 bg-accent/70",
      )}
    >
      <header className="flex items-center gap-2 border-b border-border/70 px-3.5 py-3">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[status])} />
        <h2 className="text-[13px] font-semibold tracking-tight">{STATUS_LABEL[status]}</h2>
        <span className="nums rounded-md bg-background px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {tasks.length}
        </span>

        <TaskDialog
          team={shared.team}
          projects={shared.projects}
          defaultStatus={status}
          onSaved={shared.onChanged}
          trigger={
            <DialogTrigger
              render={<Button variant="ghost" size="icon-sm" className="ml-auto" />}
              aria-label={`Nueva tarea en ${STATUS_LABEL[status]}`}
            >
              <Plus className="size-4" />
            </DialogTrigger>
          }
        />
      </header>

      <div className="flex min-h-[120px] flex-col gap-2 p-2">
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} {...shared} />
        ))}

        {tasks.length === 0 && (
          <p
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-8 text-center text-[12px] leading-relaxed text-muted-foreground transition-colors duration-150",
              isOver && "border-primary/45 text-accent-foreground",
            )}
          >
            {isOver ? "Suelta aquí" : STATUS_EMPTY[status]}
          </p>
        )}
      </div>
    </section>
  );
}

export function Board({
  tasks,
  team,
  projects,
  isAdmin,
  onChanged,
}: {
  tasks: TaskOverview[];
} & Shared) {
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<TaskOverview | null>(null);

  // The card jumps to the new column right away; if the database rejects the
  // change, the reload puts it back where it was.
  const [optimisticTasks, applyMove] = useOptimistic(
    tasks,
    (current: TaskOverview[], move: { id: string; status: TaskStatus }) =>
      current.map((task) => (task.id === move.id ? { ...task, status: move.status } : task)),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    // Lets the board be used with the keyboard: space to lift, arrows, space to drop.
    useSensor(KeyboardSensor),
  );

  const shared: Shared = { team, projects, isAdmin, onChanged };

  function handleDragStart(event: DragStartEvent) {
    setDragging(optimisticTasks.find((task) => task.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);

    const status = event.over?.id as TaskStatus | undefined;
    const id = String(event.active.id);
    if (!status || !STATUS_ORDER.includes(status)) return;

    const task = optimisticTasks.find((item) => item.id === id);
    if (!task || task.status === status) return;

    startTransition(async () => {
      applyMove({ id, status });
      const result = await moveTask(id, status);
      if (result.error) toast.error(result.error);
      onChanged();
    });
  }

  return (
    <DndContext
      // Fixed id: without it dnd-kit generates a different accessibility id on
      // the server and in the browser, which React reports as a mismatch.
      id="tablero"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:snap-none md:overflow-visible md:px-0 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={sortTasks(optimisticTasks.filter((task) => task.status === status))}
            {...shared}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {dragging && (
          <div className="w-[280px] rotate-1 opacity-95 shadow-lg">
            <TaskCard task={dragging} {...shared} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
