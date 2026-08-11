export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight md:text-[26px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Section title inside a page, used to break long lists into readable blocks. */
export function SectionTitle({
  children,
  count,
  tone = "default",
}: {
  children: React.ReactNode;
  count?: number;
  tone?: "default" | "danger" | "muted";
}) {
  const color =
    tone === "danger" ? "text-high" : tone === "muted" ? "text-muted-foreground" : "text-foreground";

  return (
    <h2 className={`flex items-center gap-2 text-[13px] font-semibold ${color}`}>
      {children}
      {count !== undefined && (
        <span className="nums rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {count}
        </span>
      )}
    </h2>
  );
}
