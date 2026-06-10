-- FIX rápido: columnas de marcador final + recarga schema PostgREST
-- Ejecutar TODO en Supabase → SQL Editor → Run

alter table public.predictions
  add column if not exists predicted_home_score integer,
  add column if not exists predicted_away_score integer,
  add column if not exists score_points integer not null default 0;

alter table public.predictions drop constraint if exists predictions_score_pair_check;
alter table public.predictions add constraint predictions_score_pair_check check (
  (predicted_home_score is null and predicted_away_score is null)
  or (
    predicted_home_score is not null
    and predicted_away_score is not null
    and predicted_home_score between 0 and 20
    and predicted_away_score between 0 and 20
  )
);

-- Obliga a PostgREST a ver las columnas nuevas (evita PGRST204)
notify pgrst, 'reload schema';

-- Verificación (debe devolver 3 filas)
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'predictions'
  and column_name in ('predicted_home_score', 'predicted_away_score', 'score_points');
