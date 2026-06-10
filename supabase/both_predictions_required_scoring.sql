-- Migración: ambas apuestas obligatorias (minuto + L/E/V) para sumar puntos
-- Ejecutar en SQL Editor de Supabase

create or replace function public.user_has_complete_predictions(
  p_user_id uuid,
  p_match_id uuid
) returns boolean
language sql
stable
as $$
  select
    count(*) filter (where prediction_type = 'goal') > 0
    and count(*) filter (where prediction_type = 'score') > 0
  from predictions
  where user_id = p_user_id
    and match_id = p_match_id;
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
  complete boolean;
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
    complete := user_has_complete_predictions(pred.user_id, NEW.id);

    if pred.prediction_type = 'goal' then
      if complete then
        pts := calculate_first_goal_minute_points(
          pred.predicted_minute,
          goal_minute,
          goal_extra,
          goal_second
        );
      else
        pts := 0;
      end if;

      update predictions
      set points = pts, scored_at = now()
      where id = pred.id;

      total_pts := pts;
    else
      if complete then
        score_pts := calculate_winner_prediction_points(
          pred.predicted_winner,
          NEW.home_score,
          NEW.away_score
        );
      else
        score_pts := 0;
      end if;

      update predictions
      set score_points = score_pts, scored_at = now()
      where id = pred.id;

      total_pts := score_pts;
    end if;

    if complete and total_pts > 0 then
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
