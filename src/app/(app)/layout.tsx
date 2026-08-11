import { requireSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { navItems } from "@/lib/nav-items";
import { BottomNav, SidebarNav } from "@/components/nav";
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await requireSession();
  const items = navItems(isAdmin);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 border-r bg-card px-3 py-4 md:flex">
        <Logo className="px-2" subtitle={isAdmin ? "Panel de administración" : "Tareas del equipo"} />

        <div className="flex-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trabajo
          </p>
          <SidebarNav items={items} />
        </div>

        <div className="border-t pt-2">
          <UserMenu
            variant="full"
            fullName={profile.full_name}
            username={profile.username}
            roleLabel={ROLE_LABEL[profile.role]}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight">Kanbo</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              fullName={profile.full_name}
              username={profile.username}
              roleLabel={ROLE_LABEL[profile.role]}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-7">
          {children}
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
