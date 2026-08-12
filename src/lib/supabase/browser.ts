import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * The one Supabase client of the app. Everything runs in the browser with the
 * publishable key, so the database is what enforces permissions (RLS), not the
 * screen. The secret key never travels here: it only lives in the local scripts
 * and in the GitHub Actions that send the emails.
 */
let client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. En local van en .env.local; al publicar, en las variables del repositorio.",
    );
  }

  client = createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  return client;
}

/**
 * People sign in with a username. Supabase Auth needs an email, so each account
 * carries an internal one built from the username; the real contact email lives
 * in profiles.email and is only used for notifications.
 */
export const LOGIN_EMAIL_DOMAIN = "kanbo.local";

export function loginEmailFor(username: string): string {
  return `${username.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}
