-- Migración: predicción simplificada
-- 1 gol (minuto del primer gol, sin equipo) + 1 ganador (L/E/V)
-- Ejecutar en SQL Editor de Supabase

-- Codifica minuto de partido + tiempo extra al mismo esquema que la app (1-110)
create or replace function public.encode_match_minute(p_minute integer, p_extra integer default 0)
returns integer
language plpgsql
immutable
as $$
begin
  if p_extra > 0 then
    if p_minute <= 45 then return 45 + p_extra; end if;
    return 100 + p_extra;
  end if;
  if p_minute <= 45 then return p_minute; end if;
  if p_minute <= 90 then return p_minute + 10; end if;
  return p_minute;
end;
$$;

-- Segundos del gol (regla ±30 s: ver goal_second_scoring_migration.sql)
alter table match_events
  add column if not exists event_second integer not null default 0;

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

-- Puntos: minuto efectivo exacto o «no goles» (pred_encoded = 0) con 0-0
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

-- Puntos por acertar ganador (L / E / V)
create or replace function public.calculate_winner_prediction_points(
  pred_winner text,
  actual_home integer,
  actual_away integer
) returns integer
language plpgsql
immutable
as $$
declare
  actual_winner text;
begin
  if pred_winner is null then return 0; end if;
  if actual_home > actual_away then actual_winner := 'home';
  elsif actual_home < actual_away then actual_winner := 'away';
  else actual_winner := 'draw';
  end if;
  if pred_winner = actual_winner then return 30;
  end if;
  return 0;
end;
$$;

-- Columna ganador para predicciones de resultado
alter table predictions add column if not exists predicted_winner text;

-- Quitar constraints e índices viejos ANTES de migrar filas
alter table predictions drop constraint if exists predictions_type_fields_check;
alter table predictions drop constraint if exists predictions_score_pair_check;
alter table predictions drop constraint if exists predictions_predicted_winner_check;
drop index if exists predictions_unique_goal;
drop index if exists predictions_unique_score;

-- Migrar marcadores existentes a ganador (si aplica)
update predictions
set predicted_winner = case
  when predicted_home_score > predicted_away_score then 'home'
  when predicted_home_score < predicted_away_score then 'away'
  else 'draw'
end
where prediction_type = 'score'
  and predicted_winner is null
  and predicted_home_score is not null
  and predicted_away_score is not null;

-- Limpiar campos obsoletos en filas de gol
update predictions
set predicted_team = null
where prediction_type = 'goal';

-- Limpiar marcador numérico en filas de resultado
update predictions
set predicted_home_score = null,
    predicted_away_score = null
where prediction_type = 'score';

-- Solo 1 predicción de cada tipo: conservar la más reciente (mayor id)
delete from predictions p
using predictions newer
where p.prediction_type = 'goal'
  and newer.prediction_type = 'goal'
  and p.user_id = newer.user_id
  and p.match_id = newer.match_id
  and p.id < newer.id;

delete from predictions p
using predictions newer
where p.prediction_type = 'score'
  and newer.prediction_type = 'score'
  and p.user_id = newer.user_id
  and p.match_id = newer.match_id
  and p.id < newer.id;

-- Filas de resultado sin ganador (datos incompletos del esquema anterior)
delete from predictions
where prediction_type = 'score'
  and predicted_winner is null;

-- Filas de gol sin minuto
delete from predictions
where prediction_type = 'goal'
  and predicted_minute is null;

-- Restringir campos según tipo (nuevo esquema)
alter table predictions add constraint predictions_predicted_winner_check
  check (predicted_winner is null or predicted_winner in ('home', 'draw', 'away'));

alter table predictions add constraint predictions_type_fields_check check (
  (
    prediction_type = 'goal'
    and predicted_minute is not null
    and predicted_team is null
    and predicted_home_score is null
    and predicted_away_score is null
    and predicted_winner is null
  )
  or (
    prediction_type = 'score'
    and predicted_minute is null
    and predicted_team is null
    and predicted_home_score is null
    and predicted_away_score is null
    and predicted_winner is not null
  )
);

-- Índices únicos: una predicción de cada tipo por usuario/partido
drop index if exists predictions_unique_goal;
create unique index predictions_unique_goal
  on predictions (user_id, match_id)
  where prediction_type = 'goal';

drop index if exists predictions_unique_score;
create unique index predictions_unique_score
  on predictions (user_id, match_id)
  where prediction_type = 'score';

-- Límite: 1 gol y 1 ganador por partido
create or replace function public.check_prediction_limits()
returns trigger
language plpgsql
as $$
declare
  goal_count integer;
  score_count integer;
begin
  if NEW.prediction_type = 'goal' then
    select count(*) into goal_count
    from predictions
    where user_id = NEW.user_id
      and match_id = NEW.match_id
      and prediction_type = 'goal'
      and (TG_OP = 'INSERT' or id is distinct from NEW.id);

    if goal_count >= 1 then
      raise exception 'Máximo 1 predicción de minuto del primer gol por partido';
    end if;
  elsif NEW.prediction_type = 'score' then
    select count(*) into score_count
    from predictions
    where user_id = NEW.user_id
      and match_id = NEW.match_id
      and prediction_type = 'score'
      and (TG_OP = 'INSERT' or id is distinct from NEW.id);

    if score_count >= 1 then
      raise exception 'Máximo 1 predicción de ganador por partido';
    end if;
  end if;

  return NEW;
end;
$$;

-- Registrar gol: solo actualiza marcador (puntos al finalizar)
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

-- Al finalizar: primer gol + ganador (ambas apuestas obligatorias)
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
