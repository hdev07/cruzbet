-- Migración: datos manuales vía panel admin (sin API-Football)
-- Ejecutar en SQL Editor de Supabase

-- Minuto en vivo en partidos
alter table matches
  add column if not exists current_minute integer default 0;

-- predictions.match_id: bigint (API) → uuid (matches de Supabase)
-- Si ya tienes predicciones con IDs de API, se borran (tabla vacía o datos de prueba)
truncate table predictions;

alter table predictions drop constraint if exists predictions_user_id_match_id_key;
alter table predictions drop column if exists match_id;
alter table predictions add column match_id uuid not null references matches(id) on delete cascade;
alter table predictions add constraint predictions_user_id_match_id_key unique (user_id, match_id);

-- scored_at si no existe
alter table predictions add column if not exists scored_at timestamptz;

-- Función de puntos
create or replace function public.calculate_prediction_points(
  pred_minute integer,
  pred_team text,
  goal_minute integer,
  goal_team text
) returns integer
language plpgsql
immutable
as $$
declare
  diff integer;
begin
  if pred_team is distinct from goal_team then return 0; end if;
  diff := abs(pred_minute - goal_minute);
  if diff = 0 then return 100;
  elsif diff <= 1 then return 50;
  elsif diff <= 3 then return 20;
  else return 10;
  end if;
end;
$$;

-- Al registrar gol: actualiza marcador, minuto y puntúa predicciones
create or replace function public.on_goal_scored()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  gteam text;
  home_id uuid;
  pts integer;
begin
  if NEW.event_type != 'goal' then
    return NEW;
  end if;

  select home_team_id into home_id from matches where id = NEW.match_id;

  if NEW.team_id = home_id then
    gteam := 'home';
    update matches
    set home_score = home_score + 1,
        current_minute = greatest(coalesce(current_minute, 0), NEW.minute)
    where id = NEW.match_id;
  else
    gteam := 'away';
    update matches
    set away_score = away_score + 1,
        current_minute = greatest(coalesce(current_minute, 0), NEW.minute)
    where id = NEW.match_id;
  end if;

  for pred in
    select * from predictions
    where match_id = NEW.match_id
      and scored_at is null
  loop
    pts := calculate_prediction_points(
      pred.predicted_minute, pred.predicted_team, NEW.minute, gteam
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

drop trigger if exists goal_scored_trigger on match_events;
create trigger goal_scored_trigger
  after insert on match_events
  for each row execute function public.on_goal_scored();

-- RLS admin: usar app_metadata.role (no user_metadata)
drop policy if exists "admin write matches" on matches;
create policy "admin write matches" on matches
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin write events" on match_events;
create policy "admin write events" on match_events
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin write teams" on teams;
create policy "admin write teams" on teams
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin write players" on players;
create policy "admin write players" on players
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
