import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Service-role client. Bypasses RLS, so it must never be imported from a
 * client component. Only used for admin-only work: creating users and sending
 * the notification digest.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.");

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
