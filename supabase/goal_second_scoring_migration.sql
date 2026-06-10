-- Migración: regla de ±30 segundos para el minuto del primer gol
-- Si el gol cae en el segundo 30 o después (ej. 34:45), cuenta como el siguiente minuto de la grilla.
-- Ejecutar en SQL Editor de Supabase DESPUÉS de simplified_predictions_migration.sql

alter table match_events
  add column if not exists event_second integer not null default 0;

alter table match_events drop constraint if exists match_events_event_second_check;
alter table match_events add constraint match_events_event_second_check
  check (event_second between 0 and 59);

create or replace function public.increment_encoded_minute(p_encoded integer)
returns integer
language plpgsql
immutable
as $$
begin
  if p_encoded between 1 and 44 then return p_encoded + 1;
  elsif p_encoded = 45 then return 46;
  elsif p_encoded between 46 and 54 then return p_encoded + 1;
  elsif p_encoded = 55 then return 56;
  elsif p_encoded between 56 and 99 then return p_encoded + 1;
  elsif p_encoded = 100 then return 101;
  elsif p_encoded between 101 and 109 then return p_encoded + 1;
  else return p_encoded;
  end if;
end;
$$;

create or replace function public.goal_effective_encoded_minute(
  p_minute integer,
  p_extra integer default 0,
  p_second integer default 0
) returns integer
language plpgsql
immutable
as $$
declare
  enc integer;
begin
  enc := encode_match_minute(p_minute, p_extra);
  if coalesce(p_second, 0) >= 30 then
    return increment_encoded_minute(enc);
  end if;
  return enc;
end;
$$;

create or replace function public.calculate_first_goal_minute_points(
  pred_encoded integer,
  goal_minute integer default null,
  goal_extra integer default 0,
  goal_second integer default 0
) returns integer
language plpgsql
immutable
as $$
declare
  effective integer;
begin
  if pred_encoded is null then return 0; end if;
  if pred_encoded = 0 then
    if goal_minute is null then return 50;
    return 0;
  end if;
  if goal_minute is null then return 0; end if;
  effective := goal_effective_encoded_minute(goal_minute, goal_extra, goal_second);
  if pred_encoded = effective then return 50;
  return 0;
end;
$$;

create or replace function public.on_match_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  first_goal record;
  pts integer;
  score_pts integer;
  total_pts integer;
  goal_minute integer;
  goal_extra integer;
  goal_second integer;
begin
  if OLD.status = 'finished' or NEW.status != 'finished' then
    return NEW;
  end if;

  select
    me.minute,
    coalesce(me.extra_time, 0) as extra_time,
    coalesce(me.event_second, 0) as event_second
  into first_goal
  from match_events me
  where me.match_id = NEW.id
    and me.event_type = 'goal'
  order by me.minute asc, me.extra_time asc, me.event_second asc, me.created_at asc
  limit 1;

  if first_goal is null then
    goal_minute := null;
    goal_extra := 0;
    goal_second := 0;
  else
    goal_minute := first_goal.minute;
    goal_extra := first_goal.extra_time;
    goal_second := first_goal.event_second;
  end if;

  for pred in
    select * from predictions
    where match_id = NEW.id
      and scored_at is null
  loop
    if pred.prediction_type = 'goal' then
      pts := calculate_first_goal_minute_points(
        pred.predicted_minute,
        goal_minute,
        goal_extra,
        goal_second
      );

      update predictions
      set points = pts, scored_at = now()
      where id = pred.id;

      total_pts := pts;
    else
      score_pts := calculate_winner_prediction_points(
        pred.predicted_winner,
        NEW.home_score,
        NEW.away_score
      );

      update predictions
      set score_points = score_pts, scored_at = now()
      where id = pred.id;

      total_pts := score_pts;
    end if;

    if total_pts > 0 then
      update profiles
      set points = points + total_pts
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
