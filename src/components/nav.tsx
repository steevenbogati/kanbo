"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, KanbanSquare, LayoutDashboard, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const ICONS = {
  "mi-dia": CalendarCheck,
  tablero: KanbanSquare,
  lista: List,
  panel: LayoutDashboard,
} as const;

export function navItems(isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [
    { href: "/mi-dia", label: "Mi día", icon: "mi-dia" },
    { href: "/tablero", label: "Tablero", icon: "tablero" },
    { href: "/lista", label: "Lista", icon: "lista" },
  ];
  if (isAdmin) items.push({ href: "/panel", label: "Panel", icon: "panel" });
  return items;
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar, from the `md` breakpoint up. */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive(item.href)
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom bar on phones. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px]",
                  isActive(item.href) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
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
