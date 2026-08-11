import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export type Session = {
  userId: string;
  profile: Profile;
  isAdmin: boolean;
};

/**
 * Current session with its profile. Redirects to /login when there is none,
 * so pages can assume a signed-in user.
 */
export async function requireSession(): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // The user exists in Auth but has no profile row (created before the
    // trigger existed, for example). Signing out avoids a broken shell.
    await supabase.auth.signOut();
    redirect("/login?error=perfil");
  }

  return { userId: user.id, profile, isAdmin: profile.role === "admin" };
}

/** Same as above, but only lets the admin through. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/mi-dia");
  return session;
}
