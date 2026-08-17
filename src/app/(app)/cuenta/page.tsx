"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/browser";

type Factor = { id: string; friendly_name?: string | null; status: string; factor_type: string };

function SecurityPanel() {
  const { mfaRequired } = useAuth();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase().auth.mfa.listFactors();
    setLoading(false);
    if (error) toast.error("No se pudo leer la seguridad de la cuenta.");
    else setFactors((data?.all ?? []) as Factor[]);
  }

  useEffect(() => { void Promise.resolve().then(() => load()); }, []);

  async function enroll() {
    setPending(true);
    const { data, error } = await supabase().auth.mfa.enroll({ factorType: "totp", friendlyName: "Kanbo" });
    setPending(false);
    if (error || !data) toast.error(error?.message ?? "No se pudo activar la verificación.");
    else { setFactorId(data.id); setSecret(data.totp.secret); toast.success("Copia el secreto y confirma abajo."); }
  }

  async function verify() {
    if (!factorId || code.length !== 6) { toast.error("Escribe el código de 6 dígitos."); return; }
    setPending(true);
    const { data: challenge, error: challengeError } = await supabase().auth.mfa.challenge({ factorId });
    const { error } = challengeError ? { error: challengeError } : await supabase().auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setPending(false);
    if (error) toast.error("El código no es correcto.");
    else { setSecret(null); setFactorId(null); setCode(""); toast.success("Verificación en dos pasos activada"); await load(); window.location.reload(); }
  }

  async function remove(factor: Factor) {
    setPending(true);
    const { error } = await supabase().auth.mfa.unenroll({ factorId: factor.id });
    setPending(false);
    if (error) toast.error("No se pudo desactivar la verificación."); else { toast.success("Verificación desactivada"); await load(); }
  }

  async function challenge() {
    const factor = factors.find((item) => item.status === "verified");
    if (!factor || code.length !== 6) { toast.error("Escribe el código de 6 dígitos."); return; }
    setPending(true);
    const { data, error } = await supabase().auth.mfa.challenge({ factorId: factor.id });
    const result = error ? { error } : await supabase().auth.mfa.verify({ factorId: factor.id, challengeId: data.id, code });
    setPending(false);
    if (result.error) toast.error("El código no es correcto."); else { toast.success("Cuenta verificada"); window.location.reload(); }
  }

  const verified = factors.filter((factor) => factor.status === "verified");

  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <header className="flex items-center gap-2 border-b px-4 py-3"><ShieldCheck className="size-4 text-primary" /><h2 className="text-[13px] font-semibold">Verificación en dos pasos</h2></header>
      <div className="space-y-4 px-4 py-4">
        {mfaRequired ? (
          <div className="rounded-lg bg-medium-soft p-3"><p className="text-[13px] font-semibold">Confirma tu cuenta para continuar</p><p className="mt-1 text-[12px] text-muted-foreground">Abre tu aplicación de códigos y escribe el número de 6 dígitos.</p><div className="mt-3 flex gap-2"><Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" className="h-10 max-w-32" /><Button className="h-10" disabled={pending} onClick={() => void challenge()}>{pending ? <Loader2 className="size-4 animate-spin" /> : "Verificar"}</Button></div></div>
        ) : loading ? <p className="text-[13px] text-muted-foreground">Cargando seguridad.</p> : verified.length > 0 ? (
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-done-soft text-done"><ShieldCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">Activa en esta cuenta</p><p className="text-[11px] text-muted-foreground">Se puede confirmar desde una aplicación de códigos.</p></div><Button variant="ghost" className="h-9 text-destructive" disabled={pending} onClick={() => void remove(verified[0])}><ShieldOff className="size-3.5" /> Desactivar</Button></div>
        ) : secret ? (
          <div className="space-y-3 rounded-lg bg-muted/50 p-3"><p className="text-[13px] font-semibold">Confirma la activación</p><p className="text-[12px] leading-relaxed text-muted-foreground">Añade Kanbo en Google Authenticator, Microsoft Authenticator o una aplicación similar usando este secreto:</p><code className="block break-all rounded-md bg-background p-2 text-xs">{secret}</code><div className="flex gap-2"><Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Código de 6 dígitos" className="h-10" /><Button className="h-10" disabled={pending} onClick={() => void verify()}>Confirmar</Button></div></div>
        ) : <div className="flex items-center gap-3"><KeyRound className="size-5 text-muted-foreground" /><p className="flex-1 text-[12px] leading-relaxed text-muted-foreground">Añade una capa extra de seguridad para tu cuenta.</p><Button variant="outline" className="h-9" disabled={pending} onClick={() => void enroll()}>Activar</Button></div>}
      </div>
    </section>
  );
}

export default function AccountPage() {
  const { profile } = useAuth();
  return <><PageHeader eyebrow="Tu cuenta" title={profile.full_name || profile.username} subtitle={`@${profile.username} · Puedes cambiar el tema desde tu menú.`} /><div className="mx-auto max-w-2xl space-y-4"><SecurityPanel /></div></>;
}
