/**
 * Creates a user in Supabase Auth (the only way accounts are created).
 * The profiles row appears automatically via the on_auth_user_created trigger.
 *
 * Usage:
 *   npm run crear-usuario -- correo@dominio.com "Contraseña123" "Nombre Apellido" admin
 *   npm run crear-usuario -- correo@dominio.com "Contraseña123" "Nombre Apellido"
 *                                                                  ^ sin rol = miembro
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName, role = "member"] = process.argv.slice(2);

if (!email || !password || !fullName) {
  console.error(
    'Faltan datos. Ejemplo:\n  npm run crear-usuario -- ana@empresa.com "ClaveSegura123" "Ana Pérez" admin',
  );
  process.exit(1);
}

if (!["admin", "member"].includes(role)) {
  console.error(`Rol inválido: "${role}". Usa "admin" o "member".`);
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

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // no confirmation email: the admin hands over the password
  user_metadata: { full_name: fullName, role },
});

if (error) {
  console.error(`No se pudo crear el usuario: ${error.message}`);
  process.exit(1);
}

// The trigger defaults to "member"; make sure the role really landed.
const { error: profileError } = await supabase
  .from("profiles")
  .update({ full_name: fullName, role })
  .eq("id", data.user.id);

if (profileError) {
  console.error(`Usuario creado, pero no se pudo ajustar el perfil: ${profileError.message}`);
  process.exit(1);
}

console.log(`Listo. ${fullName} <${email}> creado como ${role === "admin" ? "administrador" : "miembro"}.`);
