/**
 * Creates a user. It is the only way accounts are born: nobody can sign up.
 *
 * People sign in with the USERNAME. Supabase Auth needs an email, so the account
 * carries an internal one (usuario@kanbo.local) that nobody types; the real
 * address is stored apart and is only used for the notifications.
 *
 * Usage:
 *   npm run crear-usuario -- steeven1 "Contraseña123" "Nombre Apellido" correo@dominio.com admin
 *   npm run crear-usuario -- editor1  "Contraseña123" "Nombre Apellido" correo@dominio.com
 *                                                                                      ^ sin rol = miembro
 *
 * El correo es opcional: escribe "-" si esa persona no debe recibir avisos.
 */
import { createClient } from "@supabase/supabase-js";

const LOGIN_DOMAIN = "kanbo.local";

const [username, password, fullName, contactEmailRaw = "-", role = "member"] = process.argv.slice(2);

if (!username || !password || !fullName) {
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
    `Usuario inválido: "${username}".\nUsa entre 3 y 20 caracteres: minúsculas, números, punto, guion o guion bajo. Ejemplo: editor1`,
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const contactEmail = contactEmailRaw === "-" ? "" : contactEmailRaw;

if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
  console.error(`Correo inválido: "${contactEmail}". Escribe "-" si no quieres poner ninguno.`);
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
  email: `${username}@${LOGIN_DOMAIN}`, // interno, nadie lo escribe
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, username, role, contact_email: contactEmail },
});

if (error) {
  console.error(`No se pudo crear el usuario: ${error.message}`);
  process.exit(1);
}

// The database trigger fills the profile; we read it back to be sure.
const { data: profile } = await supabase
  .from("profiles")
  .select("username, role, email")
  .eq("id", data.user.id)
  .maybeSingle();

if (!profile) {
  console.error(
    "El usuario quedó creado, pero no se pudo leer su perfil. ¿Aplicaste todas las migraciones de /supabase?",
  );
  process.exit(1);
}

if (profile.username !== username || profile.role !== role || profile.email !== contactEmail) {
  const { error: fixError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username, role, email: contactEmail })
    .eq("id", data.user.id);

  if (fixError) {
    console.error(`El usuario quedó creado, pero no se pudo ajustar su perfil: ${fixError.message}`);
    process.exit(1);
  }
}

console.log(
  [
    `Listo. ${fullName} entra con:`,
    `  usuario:    ${username}`,
    `  contraseña: ${password}`,
    `  rol:        ${role === "admin" ? "administrador" : "miembro"}`,
    contactEmail ? `  avisos a:   ${contactEmail}` : "  avisos:     ninguno (sin correo)",
  ].join("\n"),
);
