"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";

function refresh() {
  revalidatePath("/proyectos");
  revalidatePath("/tablero");
  revalidatePath("/lista");
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, isAdmin } = await requireSession();
  if (!isAdmin) return { ok: false, error: "Solo el administrador puede crear proyectos." };

  const name = String(formData.get("name") ?? "").trim();
  const clientName = String(formData.get("client_name") ?? "").trim();
  if (!name) return { ok: false, error: "Ponle un nombre al proyecto." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .insert({ name, client_name: clientName, created_by: userId });

  if (error) return { ok: false, error: `No se pudo crear el proyecto: ${error.message}` };

  refresh();
  return { ok: true, error: null };
}

export async function setProjectArchived(id: string, archived: boolean): Promise<ActionState> {
  const { isAdmin } = await requireSession();
  if (!isAdmin) return { ok: false, error: "Solo el administrador puede archivar proyectos." };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ is_archived: archived }).eq("id", id);

  if (error) return { ok: false, error: `No se pudo actualizar el proyecto: ${error.message}` };

  refresh();
  return { ok: true, error: null };
}
