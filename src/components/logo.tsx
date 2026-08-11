import { cn } from "@/lib/utils";

/**
 * Brand mark: three ascending bars, a quiet nod to the board's columns.
 * Drawn as SVG so it stays crisp and follows the theme.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-xs",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
        <rect x="4" y="13" width="4" height="7" rx="1.5" fill="currentColor" opacity="0.55" />
        <rect x="10" y="8" width="4" height="12" rx="1.5" fill="currentColor" opacity="0.8" />
        <rect x="16" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-none tracking-tight">Kanbo</span>
        {subtitle && (
          <span className="mt-1 block truncate text-[11px] leading-none text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
    </div>
  );
}
