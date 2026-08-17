-- 0012 - Workspace improvements: checklist, time entries, dependencies,
-- notifications, templates and project profitability fields.

alter table public.projects
  add column if not exists budget_amount numeric(12, 2) not null default 0,
  add column if not exists hourly_rate numeric(10, 2) not null default 0;

alter table public.tasks
  add column if not exists estimated_hours numeric(8, 2) not null default 0;

create table if not exists public.task_checklist (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  label       text not null check (length(btrim(label)) > 0),
  is_done     boolean not null default false,
  position    numeric not null default 0,
  created_by  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists task_checklist_task_idx on public.task_checklist (task_id, position, created_at);

create table if not exists public.task_time_entries (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  started_at  timestamptz not null default now(),
  stopped_at  timestamptz,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  check (stopped_at is null or stopped_at >= started_at)
);
create index if not exists task_time_entries_task_idx on public.task_time_entries (task_id, started_at desc);
create index if not exists task_time_entries_user_active_idx on public.task_time_entries (user_id) where stopped_at is null;

create table if not exists public.task_dependencies (
  task_id       uuid not null references public.tasks (id) on delete cascade,
  depends_on_id uuid not null references public.tasks (id) on delete cascade,
  created_by    uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (task_id, depends_on_id),
  check (task_id <> depends_on_id)
);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  task_id     uuid references public.tasks (id) on delete cascade,
  kind        text not null check (kind in ('assigned', 'comment', 'status', 'due')),
  title       text not null,
  body        text not null default '',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create table if not exists public.task_templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(btrim(name)) > 0),
  title          text not null check (length(btrim(title)) > 0),
  description    text not null default '',
  priority       public.task_priority not null default 'medium',
  project_id     uuid references public.projects (id) on delete set null,
  recurrence     public.recurrence_kind not null default 'none',
  estimated_hours numeric(8, 2) not null default 0,
  created_by     uuid not null references public.profiles (id) on delete cascade,
  created_at     timestamptz not null default now()
);
create index if not exists task_templates_created_idx on public.task_templates (created_at desc);

-- RLS ------------------------------------------------------------------------
alter table public.task_checklist enable row level security;
drop policy if exists "checklist_select_task" on public.task_checklist;
create policy "checklist_select_task" on public.task_checklist for select to authenticated
  using (public.can_access_task(task_id));
drop policy if exists "checklist_insert_task" on public.task_checklist;
create policy "checklist_insert_task" on public.task_checklist for insert to authenticated
  with check (created_by = auth.uid() and public.can_access_task(task_id));
drop policy if exists "checklist_update_task" on public.task_checklist;
create policy "checklist_update_task" on public.task_checklist for update to authenticated
  using (public.can_access_task(task_id)) with check (public.can_access_task(task_id));
drop policy if exists "checklist_delete_task" on public.task_checklist;
create policy "checklist_delete_task" on public.task_checklist for delete to authenticated
  using (public.can_access_task(task_id));

alter table public.task_time_entries enable row level security;
drop policy if exists "time_entries_select_task" on public.task_time_entries;
create policy "time_entries_select_task" on public.task_time_entries for select to authenticated
  using (public.can_access_task(task_id));
drop policy if exists "time_entries_insert_self" on public.task_time_entries;
create policy "time_entries_insert_self" on public.task_time_entries for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_task(task_id));
drop policy if exists "time_entries_update_self_or_admin" on public.task_time_entries;
create policy "time_entries_update_self_or_admin" on public.task_time_entries for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "time_entries_delete_self_or_admin" on public.task_time_entries;
create policy "time_entries_delete_self_or_admin" on public.task_time_entries for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.task_dependencies enable row level security;
drop policy if exists "dependencies_select_task" on public.task_dependencies;
create policy "dependencies_select_task" on public.task_dependencies for select to authenticated
  using (public.can_access_task(task_id) or public.can_access_task(depends_on_id));
drop policy if exists "dependencies_insert_task" on public.task_dependencies;
create policy "dependencies_insert_task" on public.task_dependencies for insert to authenticated
  with check (created_by = auth.uid() and public.can_access_task(task_id) and public.can_access_task(depends_on_id));
drop policy if exists "dependencies_delete_task" on public.task_dependencies;
create policy "dependencies_delete_task" on public.task_dependencies for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

alter table public.notifications enable row level security;
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self" on public.notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.task_templates enable row level security;
drop policy if exists "templates_select_authenticated" on public.task_templates;
create policy "templates_select_authenticated" on public.task_templates for select to authenticated using (true);
drop policy if exists "templates_insert_admin" on public.task_templates;
create policy "templates_insert_admin" on public.task_templates for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());
drop policy if exists "templates_update_admin" on public.task_templates;
create policy "templates_update_admin" on public.task_templates for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "templates_delete_admin" on public.task_templates;
create policy "templates_delete_admin" on public.task_templates for delete to authenticated using (public.is_admin());

-- In-app events --------------------------------------------------------------
create or replace function public.notify_task_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null then
    if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.assignee_id is distinct from old.assignee_id) then
      insert into public.notifications (user_id, task_id, kind, title, body)
      values (new.assignee_id, new.id, 'assigned', 'Te asignaron una tarea', new.title);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'done' and old.status is distinct from 'done' and new.created_by <> new.assignee_id then
    insert into public.notifications (user_id, task_id, kind, title, body)
    values (new.created_by, new.id, 'status', 'Tarea entregada', new.title);
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_notify_events on public.tasks;
create trigger tasks_notify_events
  after insert or update of assignee_id, status on public.tasks
  for each row execute function public.notify_task_events();

create or replace function public.notify_comment_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignee uuid;
begin
  select assignee_id into v_assignee from public.tasks where id = new.task_id;
  if v_assignee is not null and v_assignee <> new.author_id then
    insert into public.notifications (user_id, task_id, kind, title, body)
    select v_assignee, new.task_id, 'comment', 'Nuevo comentario', left(new.body, 140);
  end if;
  return new;
end;
$$;

drop trigger if exists comments_notify_assignee on public.task_comments;
create trigger comments_notify_assignee
  after insert on public.task_comments
  for each row execute function public.notify_comment_author();

-- The browser calls this safe function when the notification drawer opens.
create or replace function public.prepare_due_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, task_id, kind, title, body)
  select t.assignee_id, t.id, 'due',
    case when t.due_date = current_date then 'Tarea para hoy' else 'Tarea vencida' end,
    t.title
  from public.tasks t
  where t.assignee_id is not null
    and t.status <> 'done'
    and t.due_date is not null
    and t.due_date <= current_date
    and not exists (
      select 1 from public.notifications n
      where n.user_id = t.assignee_id and n.task_id = t.id and n.kind = 'due'
        and n.created_at::date = current_date
    );
end;
$$;
revoke all on function public.prepare_due_notifications() from public;
grant execute on function public.prepare_due_notifications() to authenticated;

-- Reports --------------------------------------------------------------------
drop view if exists public.v_task_overview;
create view public.v_task_overview
with (security_invoker = true) as
select
  t.id, t.title, t.description, t.assignee_id, a.full_name as assignee_name,
  t.project_id, p.name as project_name, p.client_name, p.budget_amount, p.hourly_rate,
  t.priority, t.status, t.due_date, t.external_url, t.board_position, t.recurrence,
  t.started_at, t.completed_at, t.duration_days, t.estimated_hours,
  t.created_by, c.full_name as created_by_name, t.created_at, t.updated_at,
  (t.status <> 'done' and t.due_date is not null and t.due_date < current_date) as is_overdue,
  (t.status <> 'done' and t.due_date = current_date) as is_due_today
from public.tasks t
left join public.profiles a on a.id = t.assignee_id
left join public.profiles c on c.id = t.created_by
left join public.projects p on p.id = t.project_id;

-- Realtime publication (safe to run repeatedly).
do $$
declare v_table text;
begin
  foreach v_table in array array['tasks', 'task_comments', 'task_activity', 'notifications', 'task_checklist', 'task_time_entries'] loop
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
        and n.nspname = 'public' and c.relname = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
exception when undefined_table then
  -- Local Postgres without Supabase Realtime publication.
  null;
end;
$$;
