"use client";

import { Link } from "@/components/app-link";
import { usePathname } from "next/navigation";
import { CalendarCheck, FolderOpen, KanbanSquare, LayoutDashboard, List } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavIcon, NavItem } from "@/lib/nav-items";

const ICONS: Record<NavIcon, typeof List> = {
  "mi-dia": CalendarCheck,
  tablero: KanbanSquare,
  lista: List,
  panel: LayoutDashboard,
  proyectos: FolderOpen,
};

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar, from the `md` breakpoint up. */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150",
              active
                ? "bg-accent font-semibold text-accent-foreground"
                : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {/* Active marker: not color alone. */}
            <span
              aria-hidden
              className={cn(
                "absolute left-0 h-5 w-[3px] rounded-r-full bg-primary transition-opacity duration-150",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom bar on phones. Max 5 items, icon + label, safe-area aware. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-md md:hidden"
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
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[11px] font-medium transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-[3px] w-8 rounded-b-full bg-primary transition-opacity duration-150",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="size-[19px]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
