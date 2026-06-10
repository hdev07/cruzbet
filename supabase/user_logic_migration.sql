-- Migración: lógica de usuario (admin por email, predicciones pre-kickoff, puntos al finalizar)
-- Ejecutar en SQL Editor de Supabase DESPUÉS de admin_manual_migration.sql

-- 1) Admin automático para hcruz0716@gmail.com al registrarse
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

-- Admin existente (si ya te registraste antes de esta migración)
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = 'hcruz0716@gmail.com';

-- 2) Al registrar gol: solo actualiza marcador (sin repartir puntos)
create or replace function public.on_goal_scored()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  home_id uuid;
begin
  if NEW.event_type != 'goal' then
    return NEW;
  end if;

  select home_team_id into home_id from matches where id = NEW.match_id;

  if NEW.team_id = home_id then
    update matches
    set home_score = home_score + 1,
        current_minute = greatest(coalesce(current_minute, 0), NEW.minute)
    where id = NEW.match_id;
  else
    update matches
    set away_score = away_score + 1,
        current_minute = greatest(coalesce(current_minute, 0), NEW.minute)
    where id = NEW.match_id;
  end if;

  return NEW;
end;
$$;

-- 3) Al finalizar partido: reparte puntos vs el primer gol
create or replace function public.on_match_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  first_goal record;
  gteam text;
  home_id uuid;
  pts integer;
begin
  if OLD.status = 'finished' or NEW.status != 'finished' then
    return NEW;
  end if;

  select home_team_id into home_id from matches where id = NEW.id;

  select me.minute, me.team_id
  into first_goal
  from match_events me
  where me.match_id = NEW.id
    and me.event_type = 'goal'
  order by me.minute asc, me.created_at asc
  limit 1;

  if first_goal is null then
    update predictions
    set points = 0, scored_at = now()
    where match_id = NEW.id
      and scored_at is null;
    return NEW;
  end if;

  if first_goal.team_id = home_id then
    gteam := 'home';
  else
    gteam := 'away';
  end if;

  for pred in
    select * from predictions
    where match_id = NEW.id
      and scored_at is null
  loop
    pts := calculate_prediction_points(
      pred.predicted_minute, pred.predicted_team, first_goal.minute, gteam
    );

    update predictions
    set points = pts, scored_at = now()
    where id = pred.id;

    if pts > 0 then
      update profiles
      set points = points + pts
      where id = pred.user_id;
    end if;
  end loop;

  return NEW;
end;
$$;

drop trigger if exists match_finished_trigger on matches;
create trigger match_finished_trigger
  after update on matches
  for each row execute function public.on_match_finished();
