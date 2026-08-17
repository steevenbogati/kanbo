"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { Link } from "@/components/app-link";
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
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { formatDateTime } from "@/lib/dates";
import { toast } from "sonner";

export function NotificationsBell() {
  const { data: notifications, refresh } = useData(fetchNotifications, []);
  const [open, setOpen] = useState(false);
  const unread = notifications?.filter((item) => !item.read_at).length ?? 0;

  async function markOne(id: string) {
    const result = await markNotificationRead(id);
    if (result.error) toast.error(result.error);
    else refresh();
  }

  async function markAll() {
    const result = await markAllNotificationsRead();
    if (result.error) toast.error(result.error);
    else refresh();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Notificaciones" />}
        className="relative"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(360px,calc(100vw-2rem))]">
        <DropdownMenuGroup>
          <div className="flex items-center gap-2 px-2 py-1">
            <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
            {unread > 0 && (
              <Button variant="ghost" size="xs" className="ml-auto" onClick={() => void markAll()}>
                <CheckCheck className="size-3.5" />
                Marcar todas
              </Button>
            )}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {!notifications || notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">Todo está al día.</p>
        ) : (
          notifications.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={item.read_at ? "opacity-60" : ""}
              onClick={() => void markOne(item.id)}
              render={item.task_id ? <Link href={`/tarea?id=${item.task_id}`} /> : undefined}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.body}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </span>
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
