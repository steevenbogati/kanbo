"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import { deleteTask, moveTask } from "@/lib/data";
import type { TaskOverview, TaskStatus } from "@/lib/types/database";

/**
 * Per-task menu. Moving a task from here is the reliable path on a phone,
 * where dragging can fight with page scrolling.
 */
export function TaskMenu({
  task,
  isAdmin,
  onEdit,
  onChanged,
}: {
  task: TaskOverview;
  isAdmin: boolean;
  onEdit?: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const onDetailPage = pathname.startsWith("/tarea");

  async function move(status: TaskStatus) {
    setPending(true);
    const result = await moveTask(task.id, status);
    setPending(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success(`Movida a ${STATUS_LABEL[status]}`);
      onChanged();
    }
  }

  async function remove() {
    setPending(true);
    const result = await deleteTask(task.id);
    setPending(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Tarea borrada");
      // Standing on the detail page of a task that no longer exists would show
      // "no encontrada", so we step back to the board.
      if (onDetailPage) router.replace("/tablero");
      else onChanged();
    }
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
          <DropdownMenuItem onClick={() => router.push(`/tarea?id=${task.id}`)}>
            Ver detalle
          </DropdownMenuItem>
        )}
        {onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}

        <DropdownMenuSeparator />

        {/* The label has to live inside a group: on its own it throws. */}
        <DropdownMenuGroup className="p-0">
          <DropdownMenuLabel>Mover a</DropdownMenuLabel>
          {STATUS_ORDER.filter((status) => status !== task.status).map((status) => (
            <DropdownMenuItem key={status} onClick={() => void move(status)}>
              {STATUS_LABEL[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void remove()}>
              Borrar tarea
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
