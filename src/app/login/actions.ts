"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginState = { error: string | null };

/**
 * People sign in with a username (steeven1), never with an email.
 * Supabase Auth still needs the email, so the server looks it up first. The
 * lookup uses the service-role client because an anonymous visitor must never
 * be able to read the team's emails.
 */
async function emailForUsername(username: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select("email, is_active")
    .eq("username", username)
    .maybeSingle();

  if (!data || !data.is_active) return null;
  return data.email;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "") || "/mi-dia";

  if (!username || !password) {
    return { error: "Escribe tu usuario y tu contraseña." };
  }

  // Same message for every failure, so nadie puede adivinar qué usuarios existen.
  const genericError = { error: "Usuario o contraseña incorrectos." };

  const email = await emailForUsername(username);
  if (!email) return genericError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return genericError;

  revalidatePath("/", "layout");
  redirect(redirectTo.startsWith("/") ? redirectTo : "/mi-dia");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
