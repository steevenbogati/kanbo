import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Native <select> on purpose: on a phone it opens the system picker, which is
 * far more comfortable than a custom dropdown. Wrapped so it can carry our own
 * chevron and match the inputs.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full cursor-pointer appearance-none rounded-lg border border-input bg-transparent pl-3 pr-9 text-sm text-foreground shadow-xs transition-colors duration-150",
          "hover:border-foreground/20 focus-visible:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px]">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[12px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}
