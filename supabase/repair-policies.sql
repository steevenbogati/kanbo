-- Kanbo — reparación de políticas después de una ejecución SQL incompleta.
-- Úsalo solo si Supabase muestra el error 42710 de task_comments.
-- No borra tareas, usuarios, comentarios ni archivos.

do $$
begin
  if to_regclass('public.task_comments') is not null then
    execute 'drop policy if exists "comments_select" on public.task_comments';
    execute 'drop policy if exists "comments_insert" on public.task_comments';
    execute 'drop policy if exists "comments_update_author" on public.task_comments';
    execute 'drop policy if exists "comments_delete_author_or_admin" on public.task_comments';
  end if;
end $$;
