"use client";

import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase/browser";

export function initials(name: string, fallback: string) {
  const source = name.trim() || fallback;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Five fixed tints. Everyone keeps the same one always, so you learn to
 * recognise people by colour without it meaning anything by itself.
 */
const TINTS = [
  "bg-[oklch(0.93_0.05_20)] text-[oklch(0.42_0.14_20)]",
  "bg-[oklch(0.93_0.045_255)] text-[oklch(0.42_0.13_255)]",
  "bg-[oklch(0.93_0.05_155)] text-[oklch(0.4_0.11_155)]",
  "bg-[oklch(0.93_0.05_75)] text-[oklch(0.42_0.12_60)]",
  "bg-[oklch(0.93_0.05_300)] text-[oklch(0.42_0.13_300)]",
];

function tintFor(seed: string) {
  let total = 0;
  for (const char of seed) total += char.charCodeAt(0);
  return TINTS[total % TINTS.length];
}

export function Avatar({
  name,
  fallback = "?",
  className,
  title,
}: {
  name: string;
  fallback?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "flex size-8 shrink-0 select-none items-center justify-center rounded-full text-[11px] font-semibold",
        tintFor(name || fallback),
        className,
      )}
    >
      {initials(name, fallback)}
    </span>
  );
}

/**
 * Account block. On desktop it sits at the bottom of the sidebar showing who is
 * signed in; on mobile it is just the avatar in the header.
 */
export function UserMenu({
  fullName,
  username,
  roleLabel,
  variant = "compact",
}: {
  fullName: string;
  username: string;
  roleLabel: string;
  variant?: "compact" | "full";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Tu cuenta"
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-lg transition-colors duration-150 focus-visible:outline-none",
          variant === "full"
            ? "w-full p-2 text-left hover:bg-muted"
            : "size-10 justify-center hover:bg-muted",
        )}
      >
        <Avatar name={fullName} fallback={username} />
        {variant === "full" && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-tight">
                {fullName || username}
              </span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                {roleLabel}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2">
          <p className="truncate text-sm font-semibold">{fullName || username}</p>
          <p className="truncate text-xs text-muted-foreground">@{username}</p>
          <p className="mt-1.5 inline-flex rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {roleLabel}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {isDark ? "Modo claro" : "Modo oscuro"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => void supabase().auth.signOut()}
        >
          <LogOut className="size-4" />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
