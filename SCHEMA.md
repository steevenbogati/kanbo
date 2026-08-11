# Esquema de base de datos (Fase 0 — para tu aprobación)

Explicado en simple, con el detalle técnico abajo. Nada de esto está creado todavía:
primero lo apruebas, después lo escribo como migraciones SQL en `/supabase/migrations`.

---

## 1. En palabras simples

Necesitamos guardar 6 cosas:

| Qué guarda | Tabla | Para qué sirve |
|---|---|---|
| Las personas del equipo y su rol | `profiles` | Saber quién es admin y quién miembro |
| Los clientes / proyectos | `projects` | Agrupar tareas por cliente |
| Las tareas | `tasks` | El corazón de la app |
| Los comentarios | `task_comments` | Hilo de conversación por tarea |
| Los archivos adjuntos | `task_attachments` | Referencia a los archivos en Supabase Storage |
| La bitácora de cambios de estado | `task_activity` | Historial automático: quién movió qué y cuándo |

El tiempo de entrega **no se calcula a mano**: la base de datos guarda automáticamente
la fecha en que la tarea entró a "en progreso" y la fecha en que pasó a "hecho", y de
ahí saca los días que tomó. Nadie puede falsearlo desde la app.

Las tareas recurrentes también se regeneran automáticamente en la base de datos: cuando
marcas como "hecha" una tarea semanal, se crea sola la siguiente con fecha +7 días.

---

## 2. Tablas y campos

### Tipos (enums)
Los valores se guardan en inglés y la interfaz los muestra en español.

```
user_role       : admin | member
task_priority   : low | medium | high            → baja | media | alta
task_status     : backlog | in_progress | in_review | done
                  → backlog | en progreso | en revisión | hecho
recurrence_kind : none | daily | weekly | monthly → ninguna | diaria | semanal | mensual
```

### `profiles`
Espejo de los usuarios de Supabase Auth (Auth no permite guardar campos propios).
Se crea solo con un trigger cuando tú creas el usuario en Supabase.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | = `auth.users.id`, on delete cascade |
| `full_name` | text | Nombre visible |
| `email` | text | Copia para mostrar en listas sin llamar a Auth |
| `role` | user_role | default `member` |
| `is_active` | boolean | default true (para desactivar sin borrar) |
| `created_at` | timestamptz | |

### `projects`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | Ej. "Rediseño web" |
| `client_name` | text | Ej. "Bogati" |
| `is_archived` | boolean | default false |
| `created_by` | uuid → profiles | |
| `created_at` | timestamptz | |

### `tasks`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `description` | text | |
| `assignee_id` | uuid → profiles | responsable (puede quedar vacío) |
| `project_id` | uuid → projects | on delete set null |
| `priority` | task_priority | default `medium` |
| `status` | task_status | default `backlog` |
| `due_date` | date | fecha de entrega |
| `external_url` | text | enlace externo (Drive, Figma, repo…) |
| `board_position` | numeric | orden dentro de la columna del Kanban |
| `recurrence` | recurrence_kind | default `none` |
| `recurrence_parent_id` | uuid → tasks | de qué tarea nació esta repetición |
| `started_at` | timestamptz | **automático**: primera vez que entró a "en progreso" |
| `completed_at` | timestamptz | **automático**: cuándo pasó a "hecho" |
| `duration_days` | numeric(6,2) | **automático**: días entre `started_at` y `completed_at` |
| `assignment_notified_at` | timestamptz | control anti-duplicado del correo de asignación |
| `due_notified_on` | date | control anti-duplicado del correo de vencimiento |
| `created_by` | uuid → profiles | |
| `created_at` / `updated_at` | timestamptz | `updated_at` por trigger |

Índices: `assignee_id`, `status`, `project_id`, `due_date`, y uno compuesto
`(status, board_position)` para el Kanban.

### `task_comments`
| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `task_id` | uuid → tasks, on delete cascade |
| `author_id` | uuid → profiles |
| `body` | text NOT NULL |
| `created_at` | timestamptz |

Hilo simple: orden por `created_at`, sin respuestas anidadas.

### `task_attachments`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `task_id` | uuid → tasks, cascade | |
| `storage_path` | text | ruta en el bucket: `task-files/<task_id>/<uuid>-<nombre>` |
| `file_name` | text | nombre original para mostrar |
| `file_size` | bigint | |
| `mime_type` | text | |
| `uploaded_by` | uuid → profiles | |
| `created_at` | timestamptz | |

### `task_activity` (bitácora automática)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `task_id` | uuid → tasks, cascade | |
| `actor_id` | uuid → profiles | quién hizo el cambio |
| `from_status` | task_status | null si es la creación |
| `to_status` | task_status | |
| `created_at` | timestamptz | |

Se llena **solo por trigger**, nunca desde la app: así el historial no se puede editar.

---

## 3. Relaciones

```
auth.users ──1:1── profiles
profiles ──1:N── tasks           (como responsable: assignee_id)
profiles ──1:N── tasks           (como creador: created_by)
projects ──1:N── tasks
tasks    ──1:N── task_comments
tasks    ──1:N── task_attachments
tasks    ──1:N── task_activity
tasks    ──1:N── tasks           (recurrencia: recurrence_parent_id)
```

---

## 4. Seguridad (RLS) — la parte importante

RLS activada en **todas** las tablas. Los permisos viven en la base de datos, no en la
pantalla: aunque alguien abra la consola del navegador, no puede ver ni tocar lo que no
le corresponde.

Función de apoyo (`security definer`, evita recursión al leer `profiles` dentro de las
políticas de `profiles`):

```sql
create function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;
```

Y la regla que se repite para todo lo que cuelga de una tarea:

```sql
create function public.can_access_task(p_task_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.tasks t
    where t.id = p_task_id
      and (t.assignee_id = auth.uid() or t.created_by = auth.uid())
  );
$$;
```

### Políticas por tabla

| Tabla | SELECT (ver) | INSERT (crear) | UPDATE (editar) | DELETE (borrar) |
|---|---|---|---|---|
| `profiles` | todos los autenticados (para mostrar nombres en filtros y asignaciones) | nadie desde la app (solo el trigger de Auth) | uno mismo su `full_name`; el admin cualquiera, incluido `role` | nadie |
| `projects` | todos los autenticados | solo admin | solo admin | solo admin |
| `tasks` | admin todo; miembro solo donde es `assignee_id` **o** `created_by` | admin cualquiera; miembro solo si `created_by = auth.uid()` **y** `assignee_id = auth.uid()` (un miembro no reparte trabajo a otro) | admin todo; miembro solo sus tareas (responsable o creador) | solo admin |
| `task_comments` | `can_access_task(task_id)` | `can_access_task(task_id)` **y** `author_id = auth.uid()` | solo el autor | autor o admin |
| `task_attachments` | `can_access_task(task_id)` | `can_access_task(task_id)` **y** `uploaded_by = auth.uid()` | nadie (se borra y se sube de nuevo) | quien lo subió, o admin |
| `task_activity` | `can_access_task(task_id)` | nadie (solo el trigger) | nadie | nadie |

**Restricción extra sobre `tasks`:** un miembro no puede reasignar su tarea a otra
persona ni cambiarse el rol. Se garantiza con el `WITH CHECK` de la política de UPDATE
(la fila resultante debe seguir cumpliendo la condición) más un trigger que bloquea
cambios de `assignee_id` si quien edita no es admin.

### Storage
Bucket **privado** `task-files`. La primera carpeta de la ruta es el `task_id`, y las
políticas sobre `storage.objects` usan `can_access_task((storage.foldername(name))[1]::uuid)`
para leer/subir/borrar. Los archivos se muestran con URLs firmadas de duración corta:
nada queda público.

---

## 5. Automatizaciones en la base de datos (triggers)

1. **`on_auth_user_created`** — crea el `profiles` cuando tú das de alta un usuario.
2. **`tasks_touch_updated_at`** — mantiene `updated_at`.
3. **`tasks_track_time`** — al pasar a `in_progress` por primera vez graba `started_at`;
   al pasar a `done` graba `completed_at` y calcula `duration_days`. Si la sacan de
   "hecho", limpia `completed_at` y `duration_days`.
4. **`tasks_log_status`** — inserta en `task_activity` en cada creación y cada cambio de
   estado.
5. **`tasks_guard_assignee`** — impide que un miembro cambie el responsable.
6. **`tasks_spawn_recurrence`** — al pasar a `done` una tarea con `recurrence <> 'none'`,
   crea la siguiente (misma info, estado `backlog`, `due_date` +1 día / +7 días / +1 mes,
   `recurrence_parent_id` apuntando a la original). No se duplica si ya existe una hija
   abierta.

## 6. Vistas para el dashboard

Dos vistas de solo lectura, para que el dashboard sea una consulta simple y respete RLS:

- `v_workload_by_person` — tareas abiertas, vencidas y entregadas en los últimos 7 días
  por persona, más el promedio de `duration_days`.
- `v_task_overview` — tarea + nombre del responsable + nombre del proyecto/cliente +
  bandera `is_overdue`, para la vista lista y los filtros.

## 7. Orden de las migraciones

```
supabase/migrations/
  0001_extensions_and_enums.sql
  0002_profiles.sql              (tabla + trigger de Auth + RLS)
  0003_projects.sql
  0004_tasks.sql                 (tabla + índices + RLS)
  0005_task_children.sql         (comments, attachments, activity + RLS)
  0006_task_triggers.sql         (tiempo, bitácora, recurrencia, guard de responsable)
  0007_storage.sql               (bucket privado + políticas)
  0008_views.sql                 (vistas del dashboard)
```

---

## Lo que necesito de ti para arrancar la Fase 1

Solo esto (lo demás lo resuelvo yo):

1. **Nombre del proyecto** (se usa en el repo de GitHub, en Vercel y en el título de la app).
2. **Los 3 correos** con nombre y rol: tú (admin), el editor, el programador.
3. **Supabase** — crea un proyecto gratis en supabase.com y pásame:
   `Project URL`, `anon public key`, `service_role key` (esta última solo la uso en local
   y en Vercel, nunca va al repo), y la contraseña de la base de datos.
4. **GitHub** — ¿creo el repo con `gh` (necesito que estés logueado) o lo creas tú y me
   pasas la URL? ¿Público o privado?
5. **Correos de notificación** — para enviar emails necesito un proveedor. Recomiendo
   **Resend** (gratis hasta 3.000 correos/mes, se conecta en 5 minutos): créate cuenta,
   verifica un dominio o usa el de prueba, y pásame el `API key` y el correo remitente.
6. **Vercel** — igual que GitHub: ¿lo conecto yo desde la CLI o prefieres hacer el
   "Import project" tú y yo te dejo todo listo?

Con el punto 1 y 2 ya puedo empezar a construir; los puntos 3 a 6 los necesito antes de
poder probar contra la base real y desplegar.
