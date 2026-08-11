import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Kanbo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entra a tu cuenta</CardTitle>
          <CardDescription>
            Usa el correo y la contraseña que te compartió el administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.error === "perfil" && (
            <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              Tu cuenta existe pero no tiene perfil. Pídele al administrador que la revise.
            </p>
          )}
          <LoginForm redirectTo={params.redirect ?? "/mi-dia"} />
        </CardContent>
      </Card>

      <p className="max-w-sm text-center text-sm text-muted-foreground">
        ¿Olvidaste tu contraseña? Escríbele al administrador para que te asigne una nueva.
      </p>
    </main>
  );
}
