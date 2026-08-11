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
