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
