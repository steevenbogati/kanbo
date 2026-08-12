export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight md:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
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
    <h2 className={`flex items-center gap-2 text-[15px] font-semibold tracking-tight ${color}`}>
      {children}
      {count !== undefined && (
        <span className="nums rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {count}
        </span>
      )}
    </h2>
  );
}
