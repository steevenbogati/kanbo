/**
 * Creates a user in Supabase Auth (the only way accounts are created).
 * The profiles row appears automatically via the on_auth_user_created trigger.
 *
 * People sign in with the USERNAME, not with the email. The email is still
 * needed for the notifications.
 *
 * Usage:
 *   npm run crear-usuario -- steeven1 "Contraseña123" "Nombre Apellido" correo@dominio.com admin
 *   npm run crear-usuario -- editor1  "Contraseña123" "Nombre Apellido" correo@dominio.com
 *                                                                                      ^ sin rol = miembro
 */
import { createClient } from "@supabase/supabase-js";

const [username, password, fullName, email, role = "member"] = process.argv.slice(2);

if (!username || !password || !fullName || !email) {
  console.error(
    [
      "Faltan datos. Ejemplo:",
      '  npm run crear-usuario -- steeven1 "ClaveSegura123" "Steeven Yanez" steeven@empresa.com admin',
      "",
      "Orden: usuario  contraseña  nombre completo  correo  [admin]",
    ].join("\n"),
  );
  process.exit(1);
}

if (!/^[a-z0-9._-]{3,20}$/.test(username)) {
  console.error(
    `Usuario inválido: "${username}".\nUsa entre 3 y 20 caracteres: minúsculas, números, punto, guion o guion bajo. Ejemplo: steeven1`,
  );
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`Correo inválido: "${email}".`);
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

if (!["admin", "member"].includes(role)) {
  console.error(`Rol inválido: "${role}". Escribe "admin" o no escribas nada para un miembro.`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: taken } = await supabase
  .from("profiles")
  .select("username")
  .eq("username", username)
  .maybeSingle();

if (taken) {
  console.error(`El usuario "${username}" ya existe. Elige otro.`);
  process.exit(1);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // no confirmation email: the admin hands over the password
  user_metadata: { full_name: fullName, username, role },
});

if (error) {
  console.error(`No se pudo crear el usuario: ${error.message}`);
  process.exit(1);
}

// The database trigger fills the profile from the data above. We read it back to
// be sure, instead of writing it again.
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("username, full_name, role")
  .eq("id", data.user.id)
  .maybeSingle();

if (profileError || !profile) {
  console.error(
    `El usuario quedó creado, pero no se pudo leer su perfil. ¿Corriste todas las migraciones de /supabase?`,
  );
  process.exit(1);
}

if (profile.username !== username || profile.role !== role) {
  const { error: fixError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username, role })
    .eq("id", data.user.id);

  if (fixError) {
    console.error(
      [
        `El usuario quedó creado, pero su perfil no coincide:`,
        `  esperado: ${username} / ${role}`,
        `  guardado: ${profile.username} / ${profile.role}`,
        ``,
        `Aplica las migraciones nuevas de /supabase/migrations y vuelve a intentar.`,
      ].join("\n"),
    );
    process.exit(1);
  }
}

console.log(
  `Listo. ${fullName} entra con el usuario "${username}" como ${
    role === "admin" ? "administrador" : "miembro"
  }.`,
);
