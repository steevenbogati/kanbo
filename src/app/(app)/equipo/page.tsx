"use client";

import { useState } from "react";
import { Check, ShieldCheck, UserRound, UserRoundX } from "lucide-react";
import { toast } from "sonner";

import { AdminOnly } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/field";
import { Avatar } from "@/components/user-menu";
import { fetchTeam, updateProfile } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { ROLE_LABEL } from "@/lib/labels";
import type { Profile, UserRole } from "@/lib/types/database";

function TeamManager({ people, onChanged }: { people: Profile[]; onChanged: () => void }) {
  const [pending, setPending] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>, person: Profile) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(person.id);
    const result = await updateProfile(person.id, {
      full_name: String(form.get("full_name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      role: String(form.get("role") ?? person.role) as UserRole,
      is_active: form.get("is_active") === "on",
    });
    setPending(null);
    if (result.error) toast.error(result.error); else { toast.success("Cuenta actualizada"); onChanged(); }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div><h2 className="text-[14px] font-semibold">Administración segura de cuentas</h2><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Aquí puedes cambiar nombre, correo de contacto, rol y activar o pausar cuentas existentes. Las contraseñas nunca se muestran ni se guardan en Kanbo.</p></div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {people.map((person) => (
          <form key={person.id} onSubmit={(event) => void save(event, person)} className="rounded-xl border bg-card p-4 shadow-xs">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={person.full_name} fallback={person.username} />
              <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{person.full_name || person.username}</p><p className="text-[12px] text-muted-foreground">@{person.username} · {ROLE_LABEL[person.role]}</p></div>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${person.is_active ? "bg-done-soft text-done" : "bg-muted text-muted-foreground"}`}>{person.is_active ? "Activa" : "Pausada"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-[12px] font-medium">Nombre</span><Input name="full_name" defaultValue={person.full_name} className="h-10" required /></label>
              <label className="space-y-1.5"><span className="text-[12px] font-medium">Correo de contacto</span><Input name="email" type="email" defaultValue={person.email} className="h-10" placeholder="Opcional" /></label>
              <label className="space-y-1.5"><span className="text-[12px] font-medium">Rol</span><NativeSelect name="role" defaultValue={person.role} className="h-10"><option value="admin">Administrador</option><option value="member">Miembro</option></NativeSelect></label>
              <label className="flex items-center gap-2 self-end pb-2 text-[12px] font-medium"><input type="checkbox" name="is_active" defaultChecked={person.is_active} className="size-4 accent-[var(--primary)]" /> Cuenta activa</label>
            </div>
            <div className="mt-4 flex justify-end"><Button type="submit" className="h-9" disabled={pending === person.id}>{pending === person.id ? "Guardando" : <><Check className="size-3.5" /> Guardar</>}</Button></div>
          </form>
        ))}
      </div>

      <section className="rounded-xl border bg-muted/35 p-4 text-[12px] leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground"><UserRound className="size-4" /> Para crear una cuenta nueva</p>
        <p className="mt-2">Por seguridad, las cuentas nuevas se crean desde el comando seguro documentado en README.md. Así la contraseña nunca pasa por el navegador ni queda en la base de datos como texto. Después de crearla, aparecerá aquí para que puedas asignarle rol y correo.</p>
        <p className="mt-2 flex items-center gap-2"><UserRoundX className="size-3.5" /> Si alguien deja el equipo, desmarca “Cuenta activa”; conservará su historial, pero no podrá entrar.</p>
      </section>
    </div>
  );
}

function TeamContent() {
  const { data, loading, error, refresh } = useData(() => fetchTeam(true));
  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title="Equipo" />;
  return <><PageHeader eyebrow="Administración" title="Equipo" subtitle="Personas, roles y acceso a Kanbo." /><TeamManager people={data} onChanged={refresh} /></>;
}

export default function TeamPage() { return <AdminOnly><TeamContent /></AdminOnly>; }
