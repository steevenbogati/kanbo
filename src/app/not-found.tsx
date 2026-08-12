import { Link } from "@/components/app-link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">No encontramos esta página</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Puede que la tarea se haya borrado, o que no tengas permiso para verla. Si crees que
        deberías verla, pídele al administrador que te la asigne.
      </p>
      <Button size="lg" nativeButton={false} render={<Link href="/mi-dia" />}>
        Ir a Mi día
      </Button>
    </main>
  );
}
