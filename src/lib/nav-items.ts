/**
 * Navigation entries. Kept out of nav.tsx (a client component) so server
 * components can build the list too.
 */
export type NavIcon = "mi-dia" | "tablero" | "lista" | "panel";

export type NavItem = { href: string; label: string; icon: NavIcon };

export function navItems(isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [
    { href: "/mi-dia", label: "Mi día", icon: "mi-dia" },
    { href: "/tablero", label: "Tablero", icon: "tablero" },
    { href: "/lista", label: "Lista", icon: "lista" },
  ];
  if (isAdmin) items.push({ href: "/panel", label: "Panel", icon: "panel" });
  return items;
}
