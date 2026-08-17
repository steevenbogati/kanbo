# Kanbo

Plataforma de tareas para el equipo. Reemplaza la coordinación por WhatsApp: cada tarea
tiene un responsable, una fecha, un estado y un historial, y tú ves de un vistazo en qué
está cada persona y cuánto demora realmente cada entrega.

**Dirección:** <https://steevenbogati.github.io/kanbo/>

Se usa desde la laptop y desde el celular. **Abre siempre en fondo claro**, sin importar
cómo tenga configurado el equipo cada persona; quien prefiera fondo oscuro lo activa desde
su menú de cuenta y queda guardado solo en su dispositivo.

---

## Qué hace

**Para todos**

- **Entrar** con un usuario corto (por ejemplo `steeven1`) y una contraseña. Nadie escribe
  su correo. Solo existen las cuentas que tú creas.
- **Mi día**: tus tareas y nada más, con las vencidas arriba y el resto ordenado por
  prioridad y fecha de entrega.
- **Tablero**: cuatro columnas (Por hacer, En progreso, En revisión, Hecho). Arrastras la
  tarjeta para cambiar de estado; en el celular es más cómodo el menú **···** de cada
  tarjeta.
- **Lista**: todas las tareas con buscador y filtros por responsable, estado, prioridad,
  proyecto y vencidas. Los filtros quedan en la dirección web, así que puedes guardar o
  compartir una vista.
- **Detalle de la tarea**: descripción, archivos adjuntos, comentarios, enlace externo y
  la bitácora de cada cambio de estado con quién lo hizo y cuándo.

**Solo para ti (administrador)**

- **Panel**: tareas abiertas, vencidas, que vencen hoy, entregadas esta semana, y por
  persona: carga, vencidas y tiempo promedio de entrega.
- **Proyectos**: crear y archivar proyectos/clientes para agrupar tareas.
- Asignar tareas a cualquiera y borrar tareas.

**Automático, sin que nadie lo toque**

- **Tiempo de entrega**: cuando una tarea entra a "En progreso" se guarda la fecha; al
  pasar a "Hecho" se calcula cuántos días tomó. Nadie puede alterar ese número.
- **Tareas recurrentes**: al completar una tarea diaria, semanal o mensual, la siguiente
  se crea sola con la fecha corrida. Si la tarea iba atrasada, la siguiente se agenda
  desde hoy y no en el pasado.
- **Bitácora**: cada cambio de estado se registra solo y no se puede editar ni borrar.
- **Correos**: aviso al asignar una tarea, y un resumen diario a cada persona con lo que
  vence hoy y lo que ya está vencido. Requiere configurar el envío (ver más abajo).

### Quién ve qué

Los permisos están en la base de datos, no en los botones de la pantalla:

- Un **miembro** solo ve y edita las tareas donde es responsable o creador.
- Un **miembro** puede crear tareas, pero solo para sí mismo, y no puede pasarle una tarea
  a otra persona.
- Solo el **administrador** ve todo, reparte trabajo, crea proyectos y borra tareas.

Esto se probó atacando la base directamente, no solo desde la pantalla. Es importante
porque la app corre entera en el navegador: la única barrera real es la base de datos, y
ahí está puesta.

---

## Cómo se publica

La app son archivos estáticos publicados en **GitHub Pages**. No hay servidor propio: el
navegador habla directo con Supabase.

**Cada vez que subes un cambio a `main`, se publica solo** (tarda 1–2 minutos). Puedes ver
el avance en la pestaña **Actions** del repositorio.

### Configuración inicial (una sola vez)

1. En el repositorio → **Settings** → **Pages** → en *Source* elige **GitHub Actions**.
2. En **Settings** → **Secrets and variables** → **Actions**:

   Pestaña **Variables** (esto no es secreto, viaja en cualquier página web):

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | el mismo de tu `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | el mismo de tu `.env.local` |
   | `NEXT_PUBLIC_APP_URL` | `https://steevenbogati.github.io/kanbo` |
   | `EMAIL_FROM` | `Kanbo <tareas@tudominio.com>` (para los correos) |

   Pestaña **Secrets** (esto sí es secreto):

   | Nombre | Valor |
   |---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | la clave secreta de Supabase |
   | `RESEND_API_KEY` | la clave de Resend (para los correos) |

3. En Supabase → **Authentication** → **URL Configuration**, pon
   `https://steevenbogati.github.io/kanbo` en *Site URL*.

---

## Levantarla en tu computadora (para probar cambios)

Necesitas [Node.js](https://nodejs.org) 20 o superior y [Git](https://git-scm.com).

1. Abre una terminal en la carpeta del proyecto.
2. Solo la primera vez: `npm install`
3. Crea el archivo de claves: copia `.env.example`, renómbralo a `.env.local` y pega tus
   valores de Supabase. Ese archivo **nunca** se sube a GitHub.
4. `npm run dev` y abre <http://localhost:3000>.

Para ver exactamente lo que se va a publicar: `npm run build` y luego `npm run ver-publicado`.

---

## Preparar la base de datos (una sola vez)

1. Entra a tu proyecto en Supabase → **SQL Editor** → **New query**.
2. Abre el archivo `supabase/apply-all.sql`, cópialo completo y pégalo ahí.
3. Presiona **Run**. Debe terminar sin errores.

Eso crea las tablas, los permisos, los automatismos y la carpeta privada de archivos.
Se puede volver a ejecutar sin dañar nada. Cuando haya cambios más adelante, llegan como
archivos nuevos en `supabase/migrations` y se aplican igual.

---

## Crear los usuarios

Solo tú creas cuentas, desde la terminal del proyecto:

```
npm run crear-usuario -- steeven1 "ContraseñaSegura123" "Steeven Yanez" steeven@dominio.com admin
npm run crear-usuario -- editor1  "ContraseñaSegura123" "Nombre Apellido" editor@dominio.com
```

El orden es: **usuario, contraseña, nombre completo, correo** y, al final, `admin` solo si
es administrador (si no escribes nada, la cuenta queda como miembro).

- El **usuario** es con lo que la persona entra: de 3 a 20 caracteres, en minúsculas, sin
  espacios ni tildes. Por ejemplo `editor1`, `juan.p`, `dev_ana`.
- El **correo** no se usa para entrar, solo para recibir los avisos. Escribe `-` si esa
  persona no debe recibir correos.
- La contraseña se la entregas tú a la persona; puede entrar de inmediato.
- Para cambiar una contraseña: Supabase → **Authentication** → **Users** → los tres puntos
  del usuario → *Reset password*.
- Para quitar a alguien: en esa misma pantalla, borra el usuario. Sus tareas quedan, sin
  responsable.

### Cuentas que ya existen

| Usuario | Rol | Para qué |
|---|---|---|
| `steeven1` | Administrador | Tu cuenta |
| `prueba1` | Miembro | Cuenta de prueba, para ver la app como la ve un miembro |

**Cambia la contraseña de tu cuenta** (pasó por un chat) y **borra la cuenta de prueba**
cuando crees las cuentas reales del editor y del programador.

---

## Encender los correos

Sin esto la app funciona igual: en lugar de enviar, **escribe el correo en la terminal**
(o en el registro de Actions) para que puedas revisar qué diría.

1. Crea una cuenta gratis en [Resend](https://resend.com) (3.000 correos al mes).
2. Verifica tu dominio, o usa el remitente de pruebas que te da Resend.
3. Pon `RESEND_API_KEY` en los *Secrets* del repositorio y `EMAIL_FROM` en las *Variables*
   (ver "Cómo se publica"). Para probar en local, ponlos también en `.env.local`.

Los correos los manda una tarea programada de GitHub que corre **cada media hora**: avisa
de las tareas recién asignadas y manda el resumen de vencimientos una vez al día por
persona. Puedes dispararla a mano en **Actions** → *Enviar notificaciones* → *Run workflow*,
o en local con `npm run notificar`.

---

## Guardar y publicar cambios

```
git add -A
git commit -m "Describe en una línea qué cambiaste"
git push
```

Con eso se publica solo. **La primera vez que hagas `git push`** en una computadora, Git te
va a pedir permiso para entrar a GitHub: se abre una ventana del navegador, aceptas con tu
cuenta y no vuelve a preguntar. Si esta computadora está guardada con otra cuenta que no
tiene acceso al repo, verás un error de *permiso denegado*; en ese caso agrega esa cuenta
como colaboradora en GitHub → **Settings** → **Collaborators**.

Nunca pegues un token de GitHub en un archivo del proyecto.

---

## Comandos

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Enciende la app en tu computadora |
| `npm run build` | Construye la versión que se publica |
| `npm run ver-publicado` | Muestra esa versión en <http://localhost:4000> |
| `npm run typecheck` | Revisa los tipos |
| `npm run lint` | Revisa el estilo del código |
| `npm run crear-usuario` | Crea una cuenta |
| `npm run notificar` | Manda los correos pendientes |
| `npm run migrar-correos` | Solo se usó una vez, al cambiar a entrar con usuario |

---

## Si algo se rompe

- **"Usuario o contraseña incorrectos"** y estás seguro de la clave: revisa que el usuario
  exista, en Supabase → **Table editor** → tabla `profiles`, columna `username`.
- **La app carga pero no aparece ninguna tarea**: revisa que corriste el SQL de
  `supabase/apply-all.sql`.
- **Supabase muestra `policy already exists`**: descarga la versión más reciente de
  `supabase/apply-all.sql`, copia el archivo completo y ejecútalo desde el inicio. Si ya
  quedó una ejecución a medias, ejecuta primero `supabase/repair-policies.sql` y luego
  vuelve a ejecutar `apply-all.sql` completo. Esto no borra información.
- **Supabase muestra `cannot drop columns from view`**: usa la versión más reciente de
  `supabase/apply-all.sql` y ejecútala completa desde el inicio. El archivo ahora
  reconstruye las vistas antes de aplicar sus columnas nuevas.
- **"Faltan NEXT_PUBLIC_SUPABASE_URL…"**: falta el `.env.local` en local, o las variables
  del repositorio si es la versión publicada.
- **La publicación falla**: mira el error en la pestaña **Actions**. Casi siempre son las
  variables del punto 2 de "Cómo se publica".
- **No llegan los correos**: entra a **Actions** → *Enviar notificaciones* y mira el
  registro. Si dice "Correo en vista previa", falta la clave de Resend.

---

## Documentos del proyecto

- [SCHEMA.md](SCHEMA.md) — cómo está armada la base de datos, tabla por tabla, y los
  permisos.
- [BACKLOG.md](BACKLOG.md) — lo que quedó fuera de esta primera versión.

## Cómo está hecho

Next.js (App Router) exportado como sitio estático, con TypeScript, Tailwind y shadcn/ui.
Supabase para base de datos, cuentas y archivos, con Row Level Security activada en todas
las tablas. Los correos los envía una tarea programada de GitHub Actions. No hay servidor
propio ni piezas extra que mantener.
La versión actual también incluye sincronización en tiempo real, campanita de avisos,
checklist por tarea, contador de horas reales, bloqueos, duplicado y acciones masivas,
calendario mensual, plantillas, gestión del equipo, exportación CSV, presupuesto y valor por
hora por proyecto, verificación en dos pasos y botones directos para Google Calendar y
WhatsApp.

Drive, Figma y GitHub se manejan con el enlace externo de cada tarea. Una integración OAuth
completa con Drive, Slack o GitHub requiere un servidor o una función segura; no se activa en
el navegador porque expondría claves. Crear cuentas nuevas sigue usando `npm run crear-usuario`
para que las contraseñas no pasen por el navegador.
