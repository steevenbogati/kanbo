# Kanbo

Plataforma de tareas para el equipo. Reemplaza la coordinación por WhatsApp: cada tarea
tiene un responsable, una fecha, un estado y un historial, y tú ves de un vistazo en qué
está cada persona y cuánto demora realmente cada entrega.

Se usa desde la laptop y desde el celular, en modo claro u oscuro.

---

## Qué hace

**Para todos**

- **Entrar** con correo y contraseña. Solo existen las cuentas que tú creas.
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
npm run crear-usuario -- correo@dominio.com "ContraseñaSegura123" "Nombre Apellido" admin
npm run crear-usuario -- editor@dominio.com "ContraseñaSegura123" "Nombre Apellido"
```

- El último dato es el rol: escribe `admin` para el administrador y **no escribas nada**
  para un miembro (el editor y el programador).
- La contraseña se la entregas tú a la persona. Puede entrar de inmediato, sin correo de
  confirmación.
- Para cambiar una contraseña: Supabase → **Authentication** → **Users** → los tres puntos
  del usuario → *Reset password* / *Update user*.
- Para quitar a alguien: en esa misma pantalla, borra el usuario. Sus tareas quedan, sin
  responsable.

### Cuentas que ya existen

| Correo | Rol | Para qué |
|---|---|---|
| `s.yanez@edibschool.com` | Administrador | Tu cuenta |
| `prueba.miembro@example.com` | Miembro | Cuenta de prueba, para ver la app como la ve un miembro |

**Cambia la contraseña de tu cuenta** (pasó por un chat) y **borra la cuenta de prueba**
cuando crees las cuentas reales del editor y del programador.

---

## Encender los correos

Sin esto la app funciona igual, solo que no envía nada.

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

Por decisión del equipo **no hay despliegue en internet**: la app se usa en local con
`npm run dev`. El día que la quieras publicar, se conecta a Vercel en pocos minutos; el
código ya está preparado para eso y no hay que cambiar nada, solo copiar las variables de
`.env.local` en Vercel.

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

- **"Correo o contraseña incorrectos"** y estás seguro de la clave: revisa que el usuario
  exista en Supabase → Authentication → Users.
- **La app carga pero no aparece ninguna tarea**: revisa que corriste el SQL de
  `supabase/apply-all.sql`.
- **"Falta SUPABASE_SERVICE_ROLE_KEY"**: falta el archivo `.env.local` o una de sus líneas.
- **El puerto está ocupado**: la terminal te ofrece otro (3001, 3002…). Úsalo.

---

## Documentos del proyecto

- [SCHEMA.md](SCHEMA.md) — cómo está armada la base de datos, tabla por tabla, y los
  permisos.
- [BACKLOG.md](BACKLOG.md) — lo que quedó fuera de esta primera versión.

## Cómo está hecho

Next.js (App Router) con TypeScript, Tailwind y shadcn/ui. Supabase para base de datos,
cuentas y archivos, con Row Level Security activada en todas las tablas. No hay servidor
propio ni piezas extra que mantener.
