/** Placeholder while a page loads, shaped like the real content. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-5 space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="rounded-xl border bg-card p-3 shadow-xs">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
              <div className="ml-auto size-6 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Cargando…</span>
    </div>
  );
}
