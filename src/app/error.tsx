"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown instead of a technical crash screen. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">Algo se rompió</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        No pudimos cargar esta pantalla. Vuelve a intentarlo; si sigue pasando, avísale al
        administrador y cuéntale qué estabas haciendo.
      </p>
      <Button size="lg" onClick={reset}>
        <RefreshCw className="size-4" />
        Intentar de nuevo
      </Button>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Código del problema: {error.digest}</p>
      )}
    </main>
  );
}
