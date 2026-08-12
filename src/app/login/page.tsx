import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, Clock3, KanbanSquare } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const HIGHLIGHTS = [
  { icon: KanbanSquare, text: "Un tablero para todos, en vez de mensajes sueltos." },
  { icon: Clock3, text: "Cada entrega deja registrado cuánto tomó." },
  { icon: CheckCircle2, text: "Cada quien ve solo lo que le toca." },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand side: only from lg up, so the phone goes straight to the form. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-card p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55] [background:radial-gradient(120%_90%_at_15%_0%,var(--accent)_0%,transparent_55%)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-border" />

        <div className="relative flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight">Kanbo</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[32px] font-semibold leading-[1.15] tracking-tight">
            El trabajo del equipo,
            <br />
            en un solo lugar.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Tareas con responsable, fecha y estado. Sin perseguir a nadie por WhatsApp.
          </p>

          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Uso interno del equipo. Las cuentas las crea el administrador.
        </p>
      </aside>

      {/* Form side */}
      <main className="flex flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight">Kanbo</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[360px]">
            <h2 className="text-[22px] font-semibold tracking-tight">Entra a tu cuenta</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Usa el usuario y la contraseña que te compartió el administrador.
            </p>

            <div className="mt-7">
              <Suspense
                fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
              >
                <LoginForm />
              </Suspense>
            </div>

            <p className="mt-8 border-t pt-5 text-[13px] leading-relaxed text-muted-foreground">
              ¿Olvidaste tu contraseña? Escríbele al administrador para que te asigne una nueva.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
