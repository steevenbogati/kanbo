"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { moveTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { sortTasks } from "@/lib/task-order";
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

function DraggableCard(props: {
  task: TaskOverview;
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id });

  return (
    <div ref={setNodeRef}>
      <TaskCard {...props} dragHandle={{ ...attributes, ...listeners }} isDragging={isDragging} />
    </div>
  );
}

function Column({
  status,
  tasks,
  team,
  projects,
  isAdmin,
}: {
  status: TaskStatus;
  tasks: TaskOverview[];
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[85vw] shrink-0 flex-col gap-2 rounded-xl border bg-muted/30 p-2 transition-colors sm:w-72 md:w-full",
        isOver && "border-foreground/30 bg-muted",
      )}
    >
      <header className="flex items-center justify-between px-1 py-0.5">
        <h2 className="text-sm font-medium">
          {STATUS_LABEL[status]}{" "}
          <span className="text-muted-foreground">({tasks.length})</span>
        </h2>
        <TaskDialog
          team={team}
          projects={projects}
          isAdmin={isAdmin}
          defaultStatus={status}
          trigger={
            <DialogTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              aria-label={`Nueva tarea en ${STATUS_LABEL[status]}`}
            >
              <Plus className="size-4" />
            </DialogTrigger>
          }
        />
      </header>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            team={team}
            projects={projects}
            isAdmin={isAdmin}
          />
        ))}
        {tasks.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nada por aquí.</p>
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
}: {
  tasks: TaskOverview[];
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<TaskOverview | null>(null);

  // The card jumps to the new column right away; if the server rejects the
  // change, the refresh puts it back where it was.
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
      router.refresh();
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={sortTasks(optimisticTasks.filter((task) => task.status === status))}
            team={team}
            projects={projects}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <DragOverlay>
        {dragging && (
          <div className="w-72 rotate-1">
            <TaskCard task={dragging} team={team} projects={projects} isAdmin={isAdmin} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
