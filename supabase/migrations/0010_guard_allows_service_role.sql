-- 0010 — The profile guard must not block the back office.
--
-- guard_profile_role() blocks a member from changing their own role, active
-- state or username. But it also fired for the service-role key and for the SQL
-- editor, because neither has an auth.uid(), so is_admin() was false there.
-- That broke `npm run crear-usuario`, which sets the role right after creating
-- the account.
--
-- Requests with no end-user session are the server itself (service-role key or
-- the SQL editor); those are already trusted. Normal API traffic always carries
-- a user, so the guard still protects it.

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No signed-in user => server-side context (service role / SQL editor).
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    raise exception 'Solo el administrador puede cambiar el rol o el estado de una cuenta.';
  end if;

  if new.username is distinct from old.username then
    raise exception 'Solo el administrador puede cambiar el usuario.';
  end if;

  return new;
end;
$$;
