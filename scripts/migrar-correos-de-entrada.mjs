/**
 * Se corre UNA sola vez, después de aplicar la migración 0011.
 *
 * Cambia el correo interno de entrada de cada cuenta a usuario@kanbo.local (el
 * que la app puede deducir sola, sin servidor) y conserva el correo real de la
 * persona en su perfil, para las notificaciones.
 *
 *   npm run migrar-correos
 */
import { createClient } from "@supabase/supabase-js";

const LOGIN_DOMAIN = "kanbo.local";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profiles, error } = await supabase
  .from("profiles")
  .select("id, username, full_name, email");

if (error) {
  console.error(`No se pudieron leer los perfiles: ${error.message}`);
  process.exit(1);
}

for (const profile of profiles ?? []) {
  const loginEmail = `${profile.username}@${LOGIN_DOMAIN}`;

  const { data: account } = await supabase.auth.admin.getUserById(profile.id);
  const currentEmail = account?.user?.email ?? "";

  if (currentEmail === loginEmail) {
    console.log(`${profile.username}: ya estaba listo`);
    continue;
  }

  // El correo real de la persona es el que tenía en Auth, si el perfil no lo tiene.
  const contactEmail = profile.email || (currentEmail.endsWith(`@${LOGIN_DOMAIN}`) ? "" : currentEmail);

  const { error: authError } = await supabase.auth.admin.updateUserById(profile.id, {
    email: loginEmail,
    email_confirm: true,
  });

  if (authError) {
    console.error(`${profile.username}: no se pudo cambiar el correo de entrada (${authError.message})`);
    continue;
  }

  if (contactEmail !== profile.email) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ email: contactEmail })
      .eq("id", profile.id);

    if (profileError) {
      console.error(`${profile.username}: no se pudo guardar el correo de contacto (${profileError.message})`);
      continue;
    }
  }

  console.log(`${profile.username}: entra con "${profile.username}", avisos a ${contactEmail || "(ninguno)"}`);
}

console.log("\nListo. Las contraseñas no cambiaron.");
