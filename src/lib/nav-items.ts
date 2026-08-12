/**
 * Navigation entries, split in two groups the way the sidebar shows them.
 * Kept out of nav.tsx (a client component) so anything can build the list.
 */
export type NavIcon = "mi-dia" | "tablero" | "lista" | "panel" | "proyectos" | "salir";

export type NavItem = {
  href: string;
  label: string;
  /** Shorter wording for the bottom bar on phones, where space is tight. */
  short?: string;
  icon: NavIcon;
};

export type NavGroup = { title: string; items: NavItem[] };

export function navGroups(isAdmin: boolean): NavGroup[] {
  const trabajo: NavItem[] = [
    { href: "/mi-dia", label: "Mi día", icon: "mi-dia" },
    { href: "/tablero", label: "Tablero", icon: "tablero" },
    { href: "/lista", label: "Todas las tareas", short: "Tareas", icon: "lista" },
  ];

  const groups: NavGroup[] = [{ title: "Trabajo", items: trabajo }];

  if (isAdmin) {
    groups.push({
      title: "Administración",
      items: [
        { href: "/panel", label: "Panel", icon: "panel" },
        { href: "/proyectos", label: "Proyectos", icon: "proyectos" },
      ],
    });
  }

  return groups;
}

/** The bottom bar on phones: never more than five, so labels stay readable. */
export function navItems(isAdmin: boolean): NavItem[] {
  return navGroups(isAdmin).flatMap((group) => group.items);
}
