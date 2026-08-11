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
