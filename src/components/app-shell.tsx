"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { ROLE_LABEL } from "@/lib/labels";
import { navGroups, navItems } from "@/lib/nav-items";
import { Link } from "@/components/app-link";
import { BottomNav, SidebarNav } from "@/components/nav";
import { Logo, LogoMark } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

/** The two views everyone lives in, as tabs at the top. */
const TABS = [
  { href: "/tablero", label: "Tablero" },
  { href: "/lista", label: "Todas las tareas" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = useAuth();
  const pathname = usePathname();
  const groups = navGroups(isAdmin);

  return (
    <div className="min-h-dvh px-0 py-0 md:px-6 md:py-6 lg:px-8 lg:py-8">
      {/* The app sits on the canvas as one big rounded panel. */}
      <div className="mx-auto flex w-full max-w-[1560px] overflow-hidden bg-card/55 backdrop-blur-xl md:min-h-[calc(100dvh-3rem)] md:rounded-[28px] md:shadow-shell md:ring-1 md:ring-white/60 dark:md:ring-white/10 lg:min-h-[calc(100dvh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden w-[248px] shrink-0 flex-col gap-8 border-r border-border/70 px-4 py-6 md:flex">
          <Logo className="px-3" />

          <div className="flex-1">
            <SidebarNav groups={groups} />
          </div>

          <div className="rounded-2xl bg-panel/80 p-2">
            <UserMenu
              variant="full"
              fullName={profile.full_name}
              username={profile.username}
              roleLabel={ROLE_LABEL[profile.role]}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar: tabs on the left, search and account on the right. */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-card/70 px-4 backdrop-blur-xl md:h-[72px] md:border-b-0 md:bg-transparent md:px-8 md:backdrop-blur-none">
            <div className="flex items-center gap-2.5 md:hidden">
              <LogoMark />
              <span className="text-[15px] font-semibold tracking-tight">Kanbo</span>
            </div>

            <nav aria-label="Vistas" className="hidden items-center gap-1 md:flex">
              {TABS.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "relative px-1 py-2 text-[14px] transition-colors duration-150",
                      active
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-primary transition-opacity duration-150",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <SearchBox className="hidden w-[240px] lg:block" />
              <ThemeToggle />
              <span className="md:hidden">
                <UserMenu
                  fullName={profile.full_name}
                  username={profile.username}
                  roleLabel={ROLE_LABEL[profile.role]}
                />
              </span>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-8 md:pt-2">{children}</main>
        </div>
      </div>

      <BottomNav items={navItems(isAdmin)} />
    </div>
  );
}
