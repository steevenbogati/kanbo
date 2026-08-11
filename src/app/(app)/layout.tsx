import { requireSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { BottomNav, navItems, SidebarNav } from "@/components/nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await requireSession();
  const items = navItems(isAdmin);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r px-3 py-4 md:flex">
        <Logo className="px-2" />
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <Logo className="md:hidden" />
          <span className="hidden truncate text-sm text-muted-foreground md:block">
            Hola, {profile.full_name.split(" ")[0] || "qué tal"}
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              roleLabel={ROLE_LABEL[profile.role]}
            />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8">{children}</main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
