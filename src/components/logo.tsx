export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">
        K
      </span>
      <span className="text-lg font-semibold tracking-tight">Kanbo</span>
    </div>
  );
}
