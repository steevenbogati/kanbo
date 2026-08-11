"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { deleteTask, moveTask } from "@/app/actions/tasks";
import type { TaskOverview, TaskStatus } from "@/lib/types/database";

/**
 * Per-task menu. Moving a task from here is the reliable path on a phone,
 * where dragging can fight with page scrolling.
 */
export function TaskMenu({
  task,
  isAdmin,
  onEdit,
}: {
  task: TaskOverview;
  isAdmin: boolean;
  onEdit?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const onDetailPage = pathname === `/tarea/${task.id}`;

  function move(status: TaskStatus) {
    startTransition(async () => {
      const result = await moveTask(task.id, status);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Movida a ${STATUS_LABEL[status]}`);
        router.refresh();
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Tarea borrada");
        // Standing on the detail page of a task that no longer exists would
        // show "no encontrada", so we step back to the board.
        if (onDetailPage) router.push("/tablero");
        else router.refresh();
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" disabled={pending} />}
        aria-label="Opciones de la tarea"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!onDetailPage && (
          <DropdownMenuItem onClick={() => router.push(`/tarea/${task.id}`)}>
            Ver detalle
          </DropdownMenuItem>
        )}
        {onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mover a</DropdownMenuLabel>
        {STATUS_ORDER.filter((status) => status !== task.status).map((status) => (
          <DropdownMenuItem key={status} onClick={() => move(status)}>
            {STATUS_LABEL[status]}
          </DropdownMenuItem>
        ))}

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={remove}>
              Borrar tarea
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
