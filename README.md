# Kanbo

Plataforma de tareas para el equipo. Reemplaza la coordinación por WhatsApp: cada tarea
tiene un responsable, una fecha, un estado y un historial, y tú ves de un vistazo en qué
está cada persona y cuánto demora realmente cada entrega.

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

Esto se probó atacando la base directamente, no solo desde la pantalla.

---

## Levantarla en tu computadora

Necesitas [Node.js](https://nodejs.org) 20 o superior y [Git](https://git-scm.com).

1. Abre una terminal en la carpeta del proyecto.
2. Solo la primera vez, instala lo necesario:
   ```
   npm install
   ```
3. Crea el archivo de claves: copia `.env.example`, renómbralo a `.env.local` y pega tus
   valores de Supabase. Ese archivo **nunca** se sube a GitHub.
4. Enciéndela:
   ```
   npm run dev
   ```
5. Abre <http://localhost:3000>. Si ese número está ocupado, la terminal te dirá cuál usar
   (por ejemplo 3001).

Para usarla desde el celular, con la app encendida busca en la terminal la línea
`Network: http://192.168.x.x:3000` y abre esa dirección en el teléfono, conectado al mismo
wifi.

**Dejarla como app en el celular:** abre esa dirección en el teléfono y usa
*Agregar a la pantalla de inicio* (Compartir → Agregar a inicio en iPhone, menú ⋮ → Instalar
aplicación en Android). Queda con su icono y se abre sin las barras del navegador.

---

## Preparar la base de datos (una sola vez)

1. Entra a tu proyecto en Supabase → **SQL Editor** → **New query**.
2. Abre el archivo `supabase/apply-all.sql`, cópialo completo y pégalo ahí.
3. Presiona **Run**. Debe terminar sin errores.

Eso crea las tablas, los permisos, los automatismos y la carpeta privada de archivos.
Se puede volver a ejecutar sin dañar nada.

Cuando haya cambios más adelante, llegan como archivos nuevos en `supabase/migrations` y
se aplican igual (o pegando de nuevo `apply-all.sql`, que los incluye todos).

---

## Crear los usuarios

Solo tú creas cuentas. Desde la terminal del proyecto:

```
npm run crear-usuario -- steeven1 "ContraseñaSegura123" "Steeven Yanez" steeven@dominio.com admin
npm run crear-usuario -- editor1  "ContraseñaSegura123" "Nombre Apellido" editor@dominio.com
```

El orden es: **usuario, contraseña, nombre completo, correo** y, al final, `admin` solo si
es administrador (si no escribes nada, la cuenta queda como miembro).

- El **usuario** es con lo que la persona entra: de 3 a 20 caracteres, en minúsculas, sin
  espacios ni tildes. Por ejemplo `editor1`, `juan.p`, `dev_ana`.
- El **correo** no se usa para entrar, solo para las notificaciones.
- La contraseña se la entregas tú a la persona. Puede entrar de inmediato, sin correo de
  confirmación.
- Para cambiar una contraseña: Supabase → **Authentication** → **Users** → los tres puntos
  del usuario → *Reset password* / *Update user*.
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
para que puedas revisar qué diría. Se ve así:

```
── Correo en vista previa (falta RESEND_API_KEY, no se envió nada) ──
Para:    editor@dominio.com
Asunto:  Nueva tarea: Subir el sitio a producción
Título:  Te asignaron una tarea
         Subir el sitio a producción
         Proyecto: Redes sociales
         Prioridad: Alta
         Entrega: 14 ago
Enlace:  http://localhost:3000/tarea/60d7417e-…
```

Para que salgan de verdad:

1. Crea una cuenta gratis en [Resend](https://resend.com) (3.000 correos al mes).
2. Verifica tu dominio, o usa el remitente de pruebas que te da Resend.
3. En `.env.local` completa:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM="Kanbo <tareas@tudominio.com>"
   ```
4. Reinicia la app (`Ctrl+C` y otra vez `npm run dev`).

El aviso al asignar una tarea sale solo. El resumen diario hay que dispararlo una vez al
día:

```
npm run recordatorios
```

Si quieres que salga solo cada mañana, en Windows abre el **Programador de tareas**, crea
una tarea diaria que ejecute ese comando en la carpeta del proyecto (la app tiene que
estar encendida). Cada tarea se avisa una sola vez al día, así que no molesta de más.

---

## Guardar y publicar cambios

El proyecto vive en GitHub: <https://github.com/steevenbogati/kanbo>

```
git add -A
git commit -m "Describe en una línea qué cambiaste"
git push
```

Por ahora **no hay despliegue en internet**: la app se usa en local con `npm run dev`.

### Cuando quieras publicarla (10 minutos, sin tocar código)

1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub → **Add New Project**
   → elige el repo `kanbo` → **Import**.
2. En **Environment Variables** pega las mismas cinco líneas de tu `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`), más:
   - `NEXT_PUBLIC_APP_URL` con la dirección que te dé Vercel (para que los enlaces de los
     correos apunten ahí).
   - `CRON_SECRET` con cualquier texto largo y secreto.
3. **Deploy**. Desde ahí, cada `git push` publica los cambios solo.

El resumen diario de vencimientos ya está agendado en `vercel.json`: se envía todos los
días a las 8:00 de Ecuador, sin que tengas que abrir nada.

En Supabase → **Authentication** → **URL Configuration**, pon la dirección de Vercel en
*Site URL*.

---

## Comandos

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Enciende la app en tu computadora |
| `npm run build` | Revisa que todo compile sin errores |
| `npm run typecheck` | Revisa los tipos |
| `npm run lint` | Revisa el estilo del código |
| `npm run crear-usuario` | Crea una cuenta |
| `npm run recordatorios` | Envía el resumen diario de vencimientos |

---

## Si algo se rompe

- **"Usuario o contraseña incorrectos"** y estás seguro de la clave: revisa que el usuario
  exista, en Supabase → **Table editor** → tabla `profiles`, columna `username`.
- **La app carga pero no aparece ninguna tarea**: revisa que corriste el SQL de
  `supabase/apply-all.sql`.
- **"Falta SUPABASE_SERVICE_ROLE_KEY"**: falta el archivo `.env.local` o una de sus líneas.
- **El puerto está ocupado**: la terminal te ofrece otro (3001, 3002…). Úsalo, y ajusta
  `NEXT_PUBLIC_APP_URL` en `.env.local` si quieres que los enlaces de los correos apunten
  a ese puerto.
- **No llegan los correos**: revisa la terminal. Si ves "Correo en vista previa", falta la
  clave de Resend.

---

## Documentos del proyecto

- [SCHEMA.md](SCHEMA.md) — cómo está armada la base de datos, tabla por tabla, y los
  permisos.
- [BACKLOG.md](BACKLOG.md) — lo que quedó fuera de esta primera versión.

## Cómo está hecho

Next.js (App Router) con TypeScript, Tailwind y shadcn/ui. Supabase para base de datos,
cuentas y archivos, con Row Level Security activada en todas las tablas. No hay servidor
propio ni piezas extra que mantener.
