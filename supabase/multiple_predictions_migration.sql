-- Migración: múltiples predicciones por partido
-- Hasta 5 predicciones de gol y 2 de marcador (independientes)
-- Ejecutar en SQL Editor DESPUÉS de score_prediction_migration.sql
-- Si falló a medias, vuelve a ejecutar el archivo completo (es idempotente).

-- 1. Tipo de predicción
alter table predictions
  add column if not exists prediction_type text not null default 'goal';

alter table predictions drop constraint if exists predictions_prediction_type_check;
alter table predictions add constraint predictions_prediction_type_check
  check (prediction_type in ('goal', 'score'));

-- 2. Quitar límite de 1 predicción por partido
alter table predictions drop constraint if exists predictions_user_id_match_id_key;

-- 3. Relajar columnas ANTES de insertar filas de marcador (sin minuto/equipo)
alter table predictions alter column predicted_minute drop not null;
alter table predictions alter column predicted_team drop not null;

-- Quitar constraint viejo que exige par de marcador en filas de gol
alter table predictions drop constraint if exists predictions_score_pair_check;
alter table predictions drop constraint if exists predictions_type_fields_check;

-- 4. Separar filas existentes que tenían gol + marcador en una sola
insert into predictions (
  user_id, match_id, prediction_type,
  predicted_home_score, predicted_away_score,
  points, score_points, scored_at, created_at
)
select
  user_id, match_id, 'score',
  predicted_home_score, predicted_away_score,
  0, score_points, scored_at, created_at
from predictions
where predicted_home_score is not null
  and predicted_away_score is not null
  and prediction_type = 'goal'
  and not exists (
    select 1 from predictions p2
    where p2.user_id = predictions.user_id
      and p2.match_id = predictions.match_id
      and p2.prediction_type = 'score'
      and p2.predicted_home_score = predictions.predicted_home_score
      and p2.predicted_away_score = predictions.predicted_away_score
  );

update predictions
set predicted_home_score = null,
    predicted_away_score = null,
    score_points = 0
where prediction_type = 'goal'
  and predicted_home_score is not null;

-- 5. Constraint según tipo
alter table predictions add constraint predictions_type_fields_check check (
  (
    prediction_type = 'goal'
    and predicted_minute is not null
    and predicted_team is not null
    and predicted_home_score is null
    and predicted_away_score is null
  )
  or (
    prediction_type = 'score'
    and predicted_minute is null
    and predicted_team is null
    and predicted_home_score is not null
    and predicted_away_score is not null
    and predicted_home_score between 0 and 20
    and predicted_away_score between 0 and 20
  )
);

-- 6. Evitar duplicados exactos
drop index if exists predictions_unique_goal;
create unique index predictions_unique_goal
  on predictions (user_id, match_id, predicted_minute, predicted_team)
  where prediction_type = 'goal';

drop index if exists predictions_unique_score;
create unique index predictions_unique_score
  on predictions (user_id, match_id, predicted_home_score, predicted_away_score)
  where prediction_type = 'score';

-- 7. Límite 5 goles / 2 marcadores por usuario y partido
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

    if goal_count >= 5 then
      raise exception 'Máximo 5 predicciones de gol por partido';
    end if;
  elsif NEW.prediction_type = 'score' then
    select count(*) into score_count
    from predictions
    where user_id = NEW.user_id
      and match_id = NEW.match_id
      and prediction_type = 'score'
      and (TG_OP = 'INSERT' or id is distinct from NEW.id);

    if score_count >= 2 then
      raise exception 'Máximo 2 predicciones de marcador por partido';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists predictions_limit_trigger on predictions;
create trigger predictions_limit_trigger
  before insert or update on predictions
  for each row execute function public.check_prediction_limits();

-- 8. Permitir eliminar predicciones propias (antes del kickoff, validado en app)
drop policy if exists "predictions_delete_own" on predictions;
create policy "predictions_delete_own" on predictions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant delete on predictions to authenticated;

-- 9. Scoring al finalizar: cada predicción se evalúa por separado
create or replace function public.on_match_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  goal_event record;
  gteam text;
  home_id uuid;
  pts integer;
  event_pts integer;
  score_pts integer;
  total_pts integer;
begin
  if OLD.status = 'finished' or NEW.status != 'finished' then
    return NEW;
  end if;

  select home_team_id into home_id from matches where id = NEW.id;

  for pred in
    select * from predictions
    where match_id = NEW.id
      and scored_at is null
  loop
    if pred.prediction_type = 'goal' then
      pts := 0;

      for goal_event in
        select me.minute, me.team_id
        from match_events me
        where me.match_id = NEW.id
          and me.event_type = 'goal'
        order by me.minute asc, me.created_at asc
      loop
        if goal_event.team_id = home_id then
          gteam := 'home';
        else
          gteam := 'away';
        end if;

        event_pts := calculate_prediction_points(
          pred.predicted_minute, pred.predicted_team,
          goal_event.minute, gteam
        );

        if event_pts > pts then
          pts := event_pts;
        end if;
      end loop;

      update predictions
      set points = pts, scored_at = now()
      where id = pred.id;

      total_pts := pts;
    else
      score_pts := calculate_score_prediction_points(
        pred.predicted_home_score,
        pred.predicted_away_score,
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
