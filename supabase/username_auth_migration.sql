-- Login por nombre de usuario (email interno + PIN de 4-8 dígitos del jugador)
--
-- En Supabase Dashboard → Authentication → Providers:
--   1. Email: activado
--   2. Confirm email: DESACTIVADO (cuentas @play.quiniela.app no reciben correo)
--   3. Google OAuth puede seguir activo en paralelo

-- Usernames únicos (sin distinguir mayúsculas)
create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(trim(username)))
  where username is not null and trim(username) <> '';

-- Perfil: priorizar el nombre elegido al registrarse por username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      nullif(split_part(new.email, '@', 1), ''),
      'Jugador'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  if lower(coalesce(new.email, '')) = 'hcruz0716@gmail.com' then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where id = new.id;
  end if;

  return new;
end;
$$;
