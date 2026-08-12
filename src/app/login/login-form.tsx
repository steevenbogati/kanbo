"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginEmailFor, supabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");

    if (!username || !password) {
      setError("Escribe tu usuario y tu contraseña.");
      return;
    }

    setPending(true);
    setError(null);

    const { error: signInError } = await supabase().auth.signInWithPassword({
      email: loginEmailFor(username),
      password,
    });

    if (signInError) {
      // Same message for every failure, so nobody can guess which users exist.
      setError("Usuario o contraseña incorrectos.");
      setPending(false);
      return;
    }

    router.replace(redirectTo?.startsWith("/") ? redirectTo : "/mi-dia");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="username" className="text-[13px]">
          Usuario
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="steeven1"
          className="h-11 text-base"
          aria-describedby="username-hint"
          aria-invalid={Boolean(error)}
          required
          autoFocus
        />
        <p id="username-hint" className="text-xs text-muted-foreground">
          El nombre corto que te dio el administrador, no tu correo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[13px]">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 pr-11 text-base"
            aria-invalid={Boolean(error)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar la contraseña" : "Mostrar la contraseña"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-lg bg-high-soft px-3 py-2.5 text-sm text-high"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" className="h-11 w-full text-[15px]" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando…
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
