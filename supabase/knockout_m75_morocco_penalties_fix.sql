-- M75 Países Bajos 1-1 Marruecos (penales 2-3, gana Marruecos)
-- ESPN evento 760488 @ Estadio BBVA, Monterrey
-- Ejecutar en SQL Editor de Supabase

UPDATE matches m
SET
  penalty_home_score = CASE
    WHEN ht.code = 'NED' THEN 2
    WHEN ht.code = 'MAR' THEN 3
    ELSE m.penalty_home_score
  END,
  penalty_away_score = CASE
    WHEN ht.code = 'NED' THEN 3
    WHEN ht.code = 'MAR' THEN 2
    ELSE m.penalty_away_score
  END,
  external_event_id = coalesce(m.external_event_id, '760488')
FROM teams ht
WHERE m.bracket_key = 'M75'
  AND m.home_team_id = ht.id
  AND m.status = 'finished'
  AND m.home_score = m.away_score;

SELECT public.refresh_knockout_bracket();

-- Comprobar:
-- SELECT bracket_key, penalty_home_score, penalty_away_score FROM matches WHERE bracket_key IN ('M75','M90');
