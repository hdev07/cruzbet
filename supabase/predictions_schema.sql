-- Ejecutar en SQL Editor de Supabase (Día 1 — quiniela)
-- Requiere: Google OAuth habilitado en Authentication → Providers

-- Perfiles de jugador (extiende auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar text,
  points integer not null default 0,
  created_at timestamptz default now()
);

-- Predicciones (match_id = ID de API-Football)
create table if not exists predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  match_id bigint not null,
  predicted_minute integer not null check (predicted_minute between 1 and 120),
  predicted_team text not null check (predicted_team in ('home', 'away')),
  created_at timestamptz default now(),
  points integer not null default 0,
  unique (user_id, match_id)
);

create index if not exists predictions_match_id_idx on predictions(match_id);
create index if not exists predictions_user_id_idx on predictions(user_id);
create index if not exists profiles_points_idx on profiles(points desc);

-- Auto-crear perfil al registrarse
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
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  if lower(new.email) = 'hcruz0716@gmail.com' then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table predictions enable row level security;

-- Profiles: lectura pública (ranking), edición propia
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select to anon, authenticated
  using (true);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Predictions: lectura pública (ranking por partido), escritura propia
drop policy if exists "predictions_select" on predictions;
create policy "predictions_select" on predictions
  for select to anon, authenticated
  using (true);

drop policy if exists "predictions_insert_own" on predictions;
create policy "predictions_insert_own" on predictions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "predictions_update_own" on predictions;
create policy "predictions_update_own" on predictions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Permisos Data API
grant select on profiles to anon, authenticated;
grant update on profiles to authenticated;
grant select on predictions to anon, authenticated;
grant insert, update on predictions to authenticated;
