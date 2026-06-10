-- Migración: predicción de marcador final
-- Ejecutar en SQL Editor de Supabase DESPUÉS de user_logic_migration.sql

alter table predictions
  add column if not exists predicted_home_score integer,
  add column if not exists predicted_away_score integer,
  add column if not exists score_points integer not null default 0;

alter table predictions drop constraint if exists predictions_score_pair_check;
alter table predictions add constraint predictions_score_pair_check check (
  (predicted_home_score is null and predicted_away_score is null)
  or (
    predicted_home_score is not null
    and predicted_away_score is not null
    and predicted_home_score between 0 and 20
    and predicted_away_score between 0 and 20
  )
);

create or replace function public.calculate_score_prediction_points(
  pred_home integer,
  pred_away integer,
  actual_home integer,
  actual_away integer
) returns integer
language plpgsql
immutable
as $$
begin
  if pred_home is null or pred_away is null then
    return 0;
  end if;

  if pred_home = actual_home and pred_away = actual_away then
    return 30;
  end if;

  if sign(pred_home - pred_away) = sign(actual_home - actual_away) then
    return 10;
  end if;

  return 0;
end;
$$;

-- Recarga cache de PostgREST (evita error PGRST204 tras ALTER TABLE)
notify pgrst, 'reload schema';

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
  score_pts integer;
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

  for pred in
    select * from predictions
    where match_id = NEW.id
      and scored_at is null
  loop
    if first_goal is null then
      pts := 0;
    else
      if first_goal.team_id = home_id then
        gteam := 'home';
      else
        gteam := 'away';
      end if;

      pts := calculate_prediction_points(
        pred.predicted_minute, pred.predicted_team, first_goal.minute, gteam
      );
    end if;

    score_pts := calculate_score_prediction_points(
      pred.predicted_home_score,
      pred.predicted_away_score,
      NEW.home_score,
      NEW.away_score
    );

    update predictions
    set points = pts,
        score_points = score_pts,
        scored_at = now()
    where id = pred.id;

    if pts + score_pts > 0 then
      update profiles
      set points = points + pts + score_pts
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

notify pgrst, 'reload schema';
