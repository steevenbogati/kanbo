-- ============================================================
-- Kanbo — todas las migraciones en un solo archivo.
-- Generado a partir de /supabase/migrations (no lo edites a mano).
-- Pégalo completo en Supabase → SQL Editor → Run.
-- Se puede volver a ejecutar sin romper nada.
-- ============================================================


-- ===== 0001_extensions_and_enums.sql =====

-- 0001 — Extensions and enum types
-- Stored values are in English; the UI translates them to Spanish.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('backlog', 'in_progress', 'in_review', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recurrence_kind as enum ('none', 'daily', 'weekly', 'monthly');
exception when duplicate_object then null; end $$;


-- ===== 0002_profiles.sql =====

-- 0002 — Profiles: mirror of auth.users with role and display name.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text not null default '',
  role       public.user_role not null default 'member',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Helper: is the current user an active admin?
-- security definer so it can read profiles from inside profiles' own policies
-- without triggering infinite recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- A profile row is created automatically whenever the admin creates a user
-- in Supabase Auth. Role and name can be seeded from user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    case
      when (new.raw_user_meta_data ->> 'role') = 'admin' then 'admin'::public.user_role
      else 'member'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the email column in sync if it is changed in Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

alter table public.profiles enable row level security;

-- Everyone signed in can read the team roster (needed for assignee pickers and filters).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Members may edit their own display name; admins may edit anyone (including role).
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Guard: a non-admin cannot escalate their own role or reactivate themselves.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Solo el administrador puede cambiar el rol o el estado de una cuenta.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- No INSERT / DELETE policies on purpose: profiles are created by the Auth
-- trigger and removed by cascade when the user is deleted in Supabase.


-- ===== 0003_projects.sql =====

-- 0003 — Projects / clients.

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  client_name text not null default '',
  is_archived boolean not null default false,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists projects_is_archived_idx on public.projects (is_archived);

alter table public.projects enable row level security;

-- The whole team needs to read projects to filter and label tasks.
drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated"
  on public.projects for select
  to authenticated
  using (true);

drop policy if exists "projects_insert_admin" on public.projects;
create policy "projects_insert_admin"
  on public.projects for insert
  to authenticated
  with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "projects_update_admin" on public.projects;
create policy "projects_update_admin"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "projects_delete_admin" on public.projects;
create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (public.is_admin());


-- ===== 0004_tasks.sql =====

-- 0004 — Tasks: the core table, plus its row level security.

create table if not exists public.tasks (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null check (length(btrim(title)) > 0),
  description             text not null default '',
  assignee_id             uuid references public.profiles (id) on delete set null,
  project_id              uuid references public.projects (id) on delete set null,
  priority                public.task_priority not null default 'medium',
  status                  public.task_status not null default 'backlog',
  due_date                date,
  external_url            text,
  board_position          numeric not null default 0,
  recurrence              public.recurrence_kind not null default 'none',
  recurrence_parent_id    uuid references public.tasks (id) on delete set null,
  started_at              timestamptz,
  completed_at            timestamptz,
  duration_days           numeric(6, 2),
  assignment_notified_at  timestamptz,
  due_notified_on         date,
  created_by              uuid not null references public.profiles (id) on delete cascade,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists tasks_assignee_idx     on public.tasks (assignee_id);
create index if not exists tasks_status_idx       on public.tasks (status);
create index if not exists tasks_project_idx      on public.tasks (project_id);
create index if not exists tasks_due_date_idx     on public.tasks (due_date);
create index if not exists tasks_board_idx        on public.tasks (status, board_position);
create index if not exists tasks_recurrence_parent_idx on public.tasks (recurrence_parent_id);

-- Helper reused by every table that hangs off a task (comments, files, log, storage).
create or replace function public.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.tasks t
    where t.id = p_task_id
      and (t.assignee_id = auth.uid() or t.created_by = auth.uid())
  );
$$;

revoke all on function public.can_access_task(uuid) from public;
grant execute on function public.can_access_task(uuid) to authenticated;

alter table public.tasks enable row level security;

-- Admin sees everything. A member sees only tasks they own or created.
drop policy if exists "tasks_select_own_or_admin" on public.tasks;
create policy "tasks_select_own_or_admin"
  on public.tasks for select
  to authenticated
  using (
    public.is_admin()
    or assignee_id = auth.uid()
    or created_by = auth.uid()
  );

-- Admin can create a task for anyone. A member can only create tasks for themselves.
drop policy if exists "tasks_insert_admin_or_self" on public.tasks;
create policy "tasks_insert_admin_or_self"
  on public.tasks for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (public.is_admin() or assignee_id = auth.uid())
  );

-- The row must still belong to the member after the update (WITH CHECK),
-- so a member cannot push their task onto somebody else.
drop policy if exists "tasks_update_own_or_admin" on public.tasks;
create policy "tasks_update_own_or_admin"
  on public.tasks for update
  to authenticated
  using (
    public.is_admin()
    or assignee_id = auth.uid()
    or created_by = auth.uid()
  )
  with check (
    public.is_admin()
    or assignee_id = auth.uid()
    or created_by = auth.uid()
  );

drop policy if exists "tasks_delete_admin" on public.tasks;
create policy "tasks_delete_admin"
  on public.tasks for delete
  to authenticated
  using (public.is_admin());


-- ===== 0005_task_children.sql =====

-- 0005 — Comments, attachments and the status activity log.

create table if not exists public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_idx on public.task_comments (task_id, created_at);

create table if not exists public.task_attachments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks (id) on delete cascade,
  storage_path text not null unique,
  file_name    text not null,
  file_size    bigint not null default 0,
  mime_type    text not null default '',
  uploaded_by  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists task_attachments_task_idx on public.task_attachments (task_id, created_at);

create table if not exists public.task_activity (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  from_status public.task_status,
  to_status   public.task_status not null,
  created_at  timestamptz not null default now()
);

create index if not exists task_activity_task_idx on public.task_activity (task_id, created_at);

-- Comments --------------------------------------------------------------------
alter table public.task_comments enable row level security;

drop policy if exists "comments_select" on public.task_comments;
create policy "comments_select"
  on public.task_comments for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "comments_insert" on public.task_comments;
create policy "comments_insert"
  on public.task_comments for insert
  to authenticated
  with check (author_id = auth.uid() and public.can_access_task(task_id));

drop policy if exists "comments_update_author" on public.task_comments;
create policy "comments_update_author"
  on public.task_comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "comments_delete_author_or_admin" on public.task_comments;
create policy "comments_delete_author_or_admin"
  on public.task_comments for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Attachments -----------------------------------------------------------------
alter table public.task_attachments enable row level security;

drop policy if exists "attachments_select" on public.task_attachments;
create policy "attachments_select"
  on public.task_attachments for select
  to authenticated
  using (public.can_access_task(task_id));

drop policy if exists "attachments_insert" on public.task_attachments;
create policy "attachments_insert"
  on public.task_attachments for insert
  to authenticated
  with check (uploaded_by = auth.uid() and public.can_access_task(task_id));

drop policy if exists "attachments_delete_uploader_or_admin" on public.task_attachments;
create policy "attachments_delete_uploader_or_admin"
  on public.task_attachments for delete
  to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

-- No UPDATE policy: to change a file you delete it and upload a new one.

-- Activity log ----------------------------------------------------------------
alter table public.task_activity enable row level security;

drop policy if exists "activity_select" on public.task_activity;
create policy "activity_select"
  on public.task_activity for select
  to authenticated
  using (public.can_access_task(task_id));

-- No INSERT / UPDATE / DELETE policies: the log is written only by triggers
-- (see 0006), so history cannot be forged or erased from the app.


-- ===== 0006_task_triggers.sql =====

-- 0006 — Automatic behaviour: timestamps, time tracking, activity log,
-- assignee guard and recurring tasks.
-- All functions are SECURITY DEFINER so they can write rows the caller's own
-- policies would reject (the activity log and the next recurring task).

-- updated_at ------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- New tasks go to the end of their Kanban column -------------------------------
create or replace function public.tasks_set_board_position()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.board_position = 0 then
    select coalesce(max(board_position), 0) + 1024
      into new.board_position
      from public.tasks
     where status = new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_set_board_position on public.tasks;
create trigger tasks_set_board_position
  before insert on public.tasks
  for each row execute function public.tasks_set_board_position();

-- Time tracking ---------------------------------------------------------------
-- started_at   : the first time the task enters "in_progress".
-- completed_at : when it moves to "done".
-- duration_days: days between the two, rounded to 2 decimals.
create or replace function public.tasks_track_time()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'in_progress' and new.started_at is null then
      new.started_at := now();
    end if;

    if new.status = 'done' then
      new.completed_at := now();
      new.duration_days := round(
        extract(epoch from (now() - coalesce(new.started_at, new.created_at))) / 86400.0,
        2
      );
    elsif old.status = 'done' then
      -- Reopened: the previous measurement is no longer valid.
      new.completed_at := null;
      new.duration_days := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_track_time on public.tasks;
create trigger tasks_track_time
  before update on public.tasks
  for each row execute function public.tasks_track_time();

-- Activity log ----------------------------------------------------------------
create or replace function public.tasks_log_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, actor_id, from_status, to_status)
    values (new.id, auth.uid(), null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.task_activity (task_id, actor_id, from_status, to_status)
    values (new.id, auth.uid(), old.status, new.status);
  end if;
  return null;
end;
$$;

drop trigger if exists tasks_log_status on public.tasks;
create trigger tasks_log_status
  after insert or update of status on public.tasks
  for each row execute function public.tasks_log_status();

-- Only the admin may change who is responsible for a task ----------------------
create or replace function public.tasks_guard_assignee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is distinct from old.assignee_id and not public.is_admin() then
    raise exception 'Solo el administrador puede cambiar el responsable de una tarea.';
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_guard_assignee on public.tasks;
create trigger tasks_guard_assignee
  before update on public.tasks
  for each row execute function public.tasks_guard_assignee();

-- Recurring tasks -------------------------------------------------------------
-- When a recurring task is completed, the next one is created automatically.
create or replace function public.tasks_spawn_recurrence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_due   date;
  v_base_date  date;
begin
  if new.status <> 'done' or old.status = 'done' or new.recurrence = 'none' then
    return null;
  end if;

  -- recurrence_parent_id points at the immediate predecessor, so this check
  -- keeps the chain from branching if a task is reopened and completed again.
  if exists (select 1 from public.tasks where recurrence_parent_id = new.id) then
    return null;
  end if;

  v_base_date := coalesce(new.due_date, current_date);

  v_next_due := case new.recurrence
    when 'daily'   then v_base_date + interval '1 day'
    when 'weekly'  then v_base_date + interval '7 days'
    when 'monthly' then v_base_date + interval '1 month'
  end::date;

  -- If the completed task was already overdue, do not schedule the next one in
  -- the past: roll it forward from today instead.
  if v_next_due < current_date then
    v_next_due := case new.recurrence
      when 'daily'   then current_date + interval '1 day'
      when 'weekly'  then current_date + interval '7 days'
      when 'monthly' then current_date + interval '1 month'
    end::date;
  end if;

  insert into public.tasks (
    title, description, assignee_id, project_id, priority, status,
    due_date, external_url, recurrence, recurrence_parent_id, created_by
  ) values (
    new.title, new.description, new.assignee_id, new.project_id, new.priority, 'backlog',
    v_next_due, new.external_url, new.recurrence, new.id, new.created_by
  );

  return null;
end;
$$;

drop trigger if exists tasks_spawn_recurrence on public.tasks;
create trigger tasks_spawn_recurrence
  after update of status on public.tasks
  for each row execute function public.tasks_spawn_recurrence();


-- ===== 0007_storage.sql =====

-- 0007 — Private storage bucket for task attachments.
-- Path convention: <task_id>/<uuid>-<original file name>
-- Files are always served through short-lived signed URLs; nothing is public.

insert into storage.buckets (id, name, public, file_size_limit)
values ('task-files', 'task-files', false, 26214400)  -- 25 MB per file
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400;

-- Reads the task id out of the first folder of the path, tolerating any path
-- that does not follow the convention (returns false instead of raising).
create or replace function public.can_access_storage_object(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_task_id uuid;
begin
  begin
    v_task_id := (storage.foldername(p_name))[1]::uuid;
  exception when others then
    return false;
  end;

  return public.can_access_task(v_task_id);
end;
$$;

revoke all on function public.can_access_storage_object(text) from public;
grant execute on function public.can_access_storage_object(text) to authenticated;

drop policy if exists "task_files_select" on storage.objects;
create policy "task_files_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'task-files' and public.can_access_storage_object(name));

drop policy if exists "task_files_insert" on storage.objects;
create policy "task_files_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-files' and public.can_access_storage_object(name));

drop policy if exists "task_files_delete" on storage.objects;
create policy "task_files_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-files' and public.can_access_storage_object(name));


-- ===== 0008_views.sql =====

-- 0008 — Read-only views for the list view and the admin dashboard.
-- security_invoker = true makes the views respect the caller's RLS policies,
-- instead of running with the owner's privileges.

create or replace view public.v_task_overview
with (security_invoker = true) as
select
  t.id,
  t.title,
  t.description,
  t.assignee_id,
  a.full_name  as assignee_name,
  t.project_id,
  p.name       as project_name,
  p.client_name,
  t.priority,
  t.status,
  t.due_date,
  t.external_url,
  t.board_position,
  t.recurrence,
  t.started_at,
  t.completed_at,
  t.duration_days,
  t.created_by,
  c.full_name  as created_by_name,
  t.created_at,
  t.updated_at,
  (t.status <> 'done' and t.due_date is not null and t.due_date < current_date) as is_overdue,
  (t.status <> 'done' and t.due_date = current_date) as is_due_today
from public.tasks t
left join public.profiles a on a.id = t.assignee_id
left join public.profiles c on c.id = t.created_by
left join public.projects p on p.id = t.project_id;

create or replace view public.v_workload_by_person
with (security_invoker = true) as
select
  pr.id                                    as profile_id,
  pr.full_name,
  pr.email,
  pr.role,
  count(t.id) filter (where t.status <> 'done')                                          as open_tasks,
  count(t.id) filter (where t.status = 'in_progress')                                    as in_progress_tasks,
  count(t.id) filter (
    where t.status <> 'done' and t.due_date is not null and t.due_date < current_date
  )                                                                                       as overdue_tasks,
  count(t.id) filter (
    where t.status = 'done' and t.completed_at >= (current_date - interval '7 days')
  )                                                                                       as done_last_7_days,
  round(avg(t.duration_days) filter (where t.status = 'done'), 2)                          as avg_duration_days
from public.profiles pr
left join public.tasks t on t.assignee_id = pr.id
where pr.is_active
group by pr.id, pr.full_name, pr.email, pr.role;

