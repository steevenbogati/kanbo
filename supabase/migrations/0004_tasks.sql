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
