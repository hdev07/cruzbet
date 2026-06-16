-- Restaurar orden cronológico en tabla comparativa (por match_date)
-- Ejecutar en SQL Editor de Supabase (no borra predicciones)

-- Paso 1: liberar M5-M11 (bracket_key es único)
UPDATE matches m
SET bracket_key = NULL
WHERE m.phase = 'group'
  AND m.bracket_key IN ('M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11');

-- Paso 2: bracket_key alineado con fecha/hora de partido
UPDATE matches m
SET bracket_key = 'M5',
    bracket_meta = '{"match_number":5}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'QAT'
  AND a.code = 'SUI'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M6',
    bracket_meta = '{"match_number":6}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M7',
    bracket_meta = '{"match_number":7}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'HAI'
  AND a.code = 'SCO'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M8',
    bracket_meta = '{"match_number":8}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUS'
  AND a.code = 'TUR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M9',
    bracket_meta = '{"match_number":9}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M10',
    bracket_meta = '{"match_number":10}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M11',
    bracket_meta = '{"match_number":11}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CIV'
  AND a.code = 'ECU'
  AND m.phase = 'group';

-- Paso 3: reconstruir jornadas por match_date (sin borrar predicciones)
delete from public.base_quiniela_round_matches;

insert into public.base_quiniela_round_matches (round_id, match_id, position)
select
  r.id,
  ordered.match_id,
  ordered.position
from (
  select
    m.id as match_id,
    ((row_number() over (order by m.match_date asc, m.created_at asc) - 1) / 16) + 1 as round_number,
    ((row_number() over (order by m.match_date asc, m.created_at asc) - 1) % 16) + 1 as position
  from public.matches m
  where m.match_date is not null
) ordered
join public.base_quiniela_rounds r on r.round_number = ordered.round_number;

notify pgrst, 'reload schema';
