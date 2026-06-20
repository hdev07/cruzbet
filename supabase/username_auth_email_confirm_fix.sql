-- Fix: login por nombre de usuario falla con "Email not confirmed"
--
-- Causa: las cuentas usan emails internos @play.quiniela.app (no reciben correo).
-- Si "Confirm email" está activo en Supabase Auth, el login con PIN falla.
--
-- Pasos obligatorios en Supabase Dashboard → Authentication → Providers → Email:
--   • Confirm email: DESACTIVADO
--
-- Este script confirma cuentas existentes y auto-confirma nuevas registraciones por username.

-- 1. Confirmar cuentas @play.quiniela.app ya creadas
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(coalesce(email, '')) like '%@play.quiniela.app'
  and email_confirmed_at is null;

-- 2. Auto-confirmar al registrarse por username (email interno)
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

  if lower(coalesce(new.email, '')) like '%@play.quiniela.app' then
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = new.id;
  end if;

  if lower(coalesce(new.email, '')) = 'hcruz0716@gmail.com' then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where id = new.id;
  end if;

  return new;
end;
$$;
