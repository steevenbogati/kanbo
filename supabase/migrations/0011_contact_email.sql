-- 0011 — The login email and the contact email are two different things.
--
-- The app is published as static files (GitHub Pages), so there is no server to
-- translate username -> email. Instead each account carries an internal login
-- email built from the username (steeven1@kanbo.local) that the browser can
-- work out on its own, and profiles.email keeps the real address used for the
-- notifications.
--
-- Because of that, profiles.email must NOT be overwritten with the Auth email
-- any more.

drop trigger if exists on_auth_user_email_changed on auth.users;
drop function if exists public.handle_user_email_change();

-- New accounts: the trigger stores the contact email that the admin passes in
-- (contact_email), and never the internal login email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_contact  text;
begin
  v_username := regexp_replace(
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1))),
    '[^a-z0-9._-]', '', 'g'
  );

  if length(v_username) < 3 then
    v_username := 'usuario' || left(replace(new.id::text, '-', ''), 4);
  end if;

  -- The contact email is optional: without it the person simply gets no emails.
  v_contact := coalesce(new.raw_user_meta_data ->> 'contact_email', '');
  if v_contact = '' and coalesce(new.email, '') not like '%@kanbo.local' then
    v_contact := coalesce(new.email, '');
  end if;

  insert into public.profiles (id, email, username, full_name, role)
  values (
    new.id,
    v_contact,
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

-- A person may fix their own contact email; the username stays untouchable.
-- (The UPDATE policy from 0002 already allows editing your own row.)
comment on column public.profiles.email is
  'Correo de contacto para las notificaciones. No es el correo con el que se entra.';
