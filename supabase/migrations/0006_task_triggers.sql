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
