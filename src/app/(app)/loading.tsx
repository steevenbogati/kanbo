/** Placeholder while a page loads, so the app never looks frozen. */
export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-2 pt-2 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
