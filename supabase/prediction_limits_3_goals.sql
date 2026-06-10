-- Límite: 3 predicciones de gol por partido (antes 5)
-- Ejecutar en SQL Editor de Supabase

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

    if goal_count >= 3 then
      raise exception 'Máximo 3 predicciones de gol por partido';
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

notify pgrst, 'reload schema';
