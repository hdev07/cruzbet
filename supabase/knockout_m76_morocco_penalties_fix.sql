-- DEPRECADO: Marruecos vs Países Bajos es M75 (Monterrey), no M76.
-- Usar: knockout_m75_morocco_penalties_fix.sql
-- Este archivo solo aplica si MAR-NED está en M76 en tu cuadro.

UPDATE matches m
SET
  penalty_home_score = CASE
    WHEN ht.code = 'MAR' THEN 3
    WHEN ht.code = 'NED' THEN 2
    ELSE m.penalty_home_score
  END,
  penalty_away_score = CASE
    WHEN ht.code = 'MAR' THEN 2
    WHEN ht.code = 'NED' THEN 3
    ELSE m.penalty_away_score
  END
FROM teams ht
WHERE m.bracket_key = 'M76'
  AND m.home_team_id = ht.id
  AND m.status = 'finished'
  AND m.home_score = m.away_score;

SELECT public.refresh_knockout_bracket();
