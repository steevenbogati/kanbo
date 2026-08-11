import type { LucideIcon } from "lucide-react";

/** Same shape everywhere something is empty: icon, what it means, what to do. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 text-center ${
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14"
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-[18px]" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {hint && <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
