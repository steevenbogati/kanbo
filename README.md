# Kanbo

Plataforma de tareas del equipo: tablero, lista, comentarios, adjuntos y tiempos de
entrega. Hecha para 3 personas (un administrador y dos miembros).

> Estado: **Fase 1 terminada** — proyecto base, conexión con Supabase y login funcionando.
> Las vistas de tareas llegan en las siguientes fases.

## Qué necesitas instalado

- [Node.js](https://nodejs.org) 20 o superior (este proyecto se probó con la 24).
- Una cuenta de [Supabase](https://supabase.com) con el proyecto ya creado.
- [Git](https://git-scm.com).

## Cómo levantarla en tu computadora

1. Abre la carpeta del proyecto en una terminal.
2. Instala lo necesario (solo la primera vez):
   ```
   npm install
   ```
3. Crea el archivo de claves: copia `.env.example` y renómbralo a `.env.local`, luego
   pega tus valores de Supabase. Ese archivo nunca se sube a GitHub.
4. Enciéndela:
   ```
   npm run dev
   ```
5. Abre <http://localhost:3000> en el navegador.

## Cómo preparar la base de datos (una sola vez)

1. Entra a tu proyecto en Supabase → **SQL Editor** → **New query**.
2. Abre el archivo `supabase/apply-all.sql`, cópialo completo y pégalo ahí.
3. Presiona **Run**. Debe terminar sin errores.

Eso crea las tablas, los permisos, los automatismos y la carpeta privada de archivos.
Si más adelante hay cambios, aparecen como archivos nuevos en `supabase/migrations`
y se aplican igual.

## Cómo crear los usuarios

Solo el administrador crea cuentas. Desde la terminal del proyecto:

```
npm run crear-usuario -- correo@dominio.com "ContraseñaSegura123" "Nombre Apellido" admin
npm run crear-usuario -- editor@dominio.com "ContraseñaSegura123" "Nombre Apellido"
```

- El cuarto dato es el rol. Escribe `admin` para el administrador y **no escribas nada**
  para un miembro normal.
- La contraseña se la entregas tú a la persona; puede entrar de inmediato, sin correo de
  confirmación.
- Para cambiar una contraseña: Supabase → **Authentication** → **Users** → los tres
  puntos del usuario → *Reset password* o *Update user*.

## Cómo guardar y publicar cambios

Este proyecto vive en GitHub: <https://github.com/steevenbogati/kanbo>

```
git add -A
git commit -m "Describe en una línea qué cambiaste"
git push
```

Por decisión del equipo **no hay despliegue automático a un servidor**: la app se usa en
local con `npm run dev`. Cuando quieras publicarla en internet, avísame y se conecta a
Vercel en pocos minutos.

## Comandos útiles

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Enciende la app en tu computadora |
| `npm run build` | Revisa que todo compile sin errores |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run lint` | Revisa el estilo del código |
| `npm run crear-usuario` | Crea una cuenta nueva |

## Documentos del proyecto

- [SCHEMA.md](SCHEMA.md) — cómo está armada la base de datos y los permisos.
- [BACKLOG.md](BACKLOG.md) — lo que quedó fuera de esta primera versión.
