"use client";

import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  LogOut,
  UsersRound,
} from "lucide-react";

import { Link } from "@/components/app-link";
import { cn } from "@/lib/utils";
import type { NavGroup, NavIcon, NavItem } from "@/lib/nav-items";

const ICONS: Record<NavIcon, typeof ListChecks> = {
  "mi-dia": CalendarCheck,
  tablero: KanbanSquare,
  lista: ListChecks,
  calendario: CalendarDays,
  panel: LayoutDashboard,
  proyectos: FolderOpen,
  plantillas: ClipboardList,
  equipo: UsersRound,
  salir: LogOut,
};

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar, from the `md` breakpoint up. */
export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Secciones" className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="eyebrow px-3 pb-2">{group.title}</p>

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-11 items-center gap-3 rounded-xl px-3 text-[13.5px] transition-colors duration-150",
                      active
                        ? "bg-accent font-semibold text-primary"
                        : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground",
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Bottom bar on phones. Icon + label, safe-area aware. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur-xl md:hidden"
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[10.5px] font-medium transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-[3px] w-9 rounded-b-full bg-primary transition-opacity duration-150",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="size-[19px]" />
                <span className="max-w-full truncate">{item.short ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
