-- 0009 — Sign in with a username instead of an email.
-- Supabase Auth still stores an email (it is required, and the notifications
-- need it), but nobody types it: the app resolves username -> email on the
-- server before signing in.

alter table public.profiles
  add column if not exists username text;

-- Backfill from the email local part, cleaned up, for accounts created before
-- this migration.
update public.profiles
   set username = regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._-]', '', 'g')
 where username is null or btrim(username) = '';

-- Anything left too short gets a predictable fallback.
update public.profiles
   set username = 'usuario' || left(replace(id::text, '-', ''), 4)
 where username is null or length(username) < 3;

alter table public.profiles
  alter column username set not null;

do $$ begin
  alter table public.profiles
    add constraint profiles_username_format
    check (username ~ '^[a-z0-9._-]{3,20}$');
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_username_key on public.profiles (username);

-- Keep the trigger in sync: the admin passes the username when creating a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := regexp_replace(
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1))),
    '[^a-z0-9._-]', '', 'g'
  );

  if length(v_username) < 3 then
    v_username := 'usuario' || left(replace(new.id::text, '-', ''), 4);
  end if;

  insert into public.profiles (id, email, username, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    v_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', v_username),
    case
      when (new.raw_user_meta_data ->> 'role') = 'admin' then 'admin'::public.user_role
      else 'member'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Nobody may change their own username: it is the login handle.
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
    if new.username is distinct from old.username then
      raise exception 'Solo el administrador puede cambiar el usuario.';
    end if;
  end if;
  return new;
end;
$$;

-- The dashboard shows the username, so it travels in the view.
-- Dropped and recreated because Postgres only allows appending view columns.
drop view if exists public.v_workload_by_person;

create view public.v_workload_by_person
with (security_invoker = true) as
select
  pr.id                                    as profile_id,
  pr.full_name,
  pr.username,
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
group by pr.id, pr.full_name, pr.username, pr.email, pr.role;
