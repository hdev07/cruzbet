-- Actualizar reglas de puntos (primer gol + marcador final)
-- Ejecutar en SQL Editor de Supabase

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
  if diff = 0 then return 50;
  elsif diff <= 1 then return 25;
  elsif diff <= 3 then return 10;
  else return 5;
  end if;
end;
$$;

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
