"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Static export has no server redirects, so the entry page sends people on from
 * the browser. Whoever is not signed in ends up at /login anyway.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mi-dia");
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6" aria-busy="true">
      <p className="text-sm text-muted-foreground">Abriendo Kanbo…</p>
    </main>
  );
}
