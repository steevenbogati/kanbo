"use client";

import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown while a screen is fetching its data. */
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-5 space-y-2">
        {title ? (
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight md:text-[26px]">
            {title}
          </h1>
        ) : (
          <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
        )}
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="rounded-xl border bg-card p-3 shadow-xs">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Shown when the data could not be loaded (no connection, for example). */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="size-[18px]" />
      </span>
      <div>
        <p className="text-sm font-medium">No pudimos cargar la información</p>
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Revisa tu conexión y vuelve a intentar. {message}
        </p>
      </div>
      <Button className="h-10" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Intentar de nuevo
      </Button>
    </div>
  );
}
