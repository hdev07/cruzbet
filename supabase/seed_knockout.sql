-- Seed: Mundial 2026 — Eliminatoria (32 partidos, M73–M104)
-- Ejecutar después de seed_group_stage.sql y knockout_bracket_migration.sql
-- Equipos se asignan automáticamente al terminar fase de grupos / cada ronda

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-06-28T19:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled', 'M73', '{"match_number":73,"home":{"type":"group_pos","group":"A","pos":2},"away":{"type":"group_pos","group":"B","pos":2},"label":"2º A vs 2º B"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M73');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-06-29T20:30:00+00', 'Gillette Stadium, Boston', 'scheduled', 'M74', '{"match_number":74,"home":{"type":"group_pos","group":"E","pos":1},"away":{"type":"best_third","groups":["A","B","C","D","F"]},"label":"1º E vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M74');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-06-30T01:00:00+00', 'Estadio BBVA, Monterrey', 'scheduled', 'M75', '{"match_number":75,"home":{"type":"group_pos","group":"F","pos":1},"away":{"type":"group_pos","group":"C","pos":2},"label":"1º F vs 2º C"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M75');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-06-29T17:00:00+00', 'NRG Stadium, Houston', 'scheduled', 'M76', '{"match_number":76,"home":{"type":"group_pos","group":"C","pos":1},"away":{"type":"group_pos","group":"F","pos":2},"label":"1º C vs 2º F"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M76');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-06-30T21:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled', 'M77', '{"match_number":77,"home":{"type":"group_pos","group":"I","pos":1},"away":{"type":"best_third","groups":["C","D","F","G","H"]},"label":"1º I vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M77');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-06-30T17:00:00+00', 'AT&T Stadium, Dallas', 'scheduled', 'M78', '{"match_number":78,"home":{"type":"group_pos","group":"E","pos":2},"away":{"type":"group_pos","group":"I","pos":2},"label":"2º E vs 2º I"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M78');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-01T01:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled', 'M79', '{"match_number":79,"home":{"type":"group_pos","group":"A","pos":1},"away":{"type":"best_third","groups":["C","E","F","H","I"]},"label":"1º A vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M79');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-01T16:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled', 'M80', '{"match_number":80,"home":{"type":"group_pos","group":"L","pos":1},"away":{"type":"best_third","groups":["E","H","I","J","K"]},"label":"1º L vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M80');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-02T00:00:00+00', 'Levi''s Stadium, San Francisco Bay Area', 'scheduled', 'M81', '{"match_number":81,"home":{"type":"group_pos","group":"D","pos":1},"away":{"type":"best_third","groups":["B","E","F","I","J"]},"label":"1º D vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M81');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-01T20:00:00+00', 'Lumen Field, Seattle', 'scheduled', 'M82', '{"match_number":82,"home":{"type":"group_pos","group":"G","pos":1},"away":{"type":"best_third","groups":["A","E","H","I","J"]},"label":"1º G vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M82');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-02T23:00:00+00', 'BMO Field, Toronto', 'scheduled', 'M83', '{"match_number":83,"home":{"type":"group_pos","group":"K","pos":2},"away":{"type":"group_pos","group":"L","pos":2},"label":"2º K vs 2º L"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M83');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-02T19:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled', 'M84', '{"match_number":84,"home":{"type":"group_pos","group":"H","pos":1},"away":{"type":"group_pos","group":"J","pos":2},"label":"1º H vs 2º J"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M84');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-03T03:00:00+00', 'BC Place, Vancouver', 'scheduled', 'M85', '{"match_number":85,"home":{"type":"group_pos","group":"B","pos":1},"away":{"type":"best_third","groups":["E","F","G","I","J"]},"label":"1º B vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M85');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-03T22:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled', 'M86', '{"match_number":86,"home":{"type":"group_pos","group":"J","pos":1},"away":{"type":"group_pos","group":"H","pos":2},"label":"1º J vs 2º H"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M86');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-04T01:30:00+00', 'Arrowhead Stadium, Kansas City', 'scheduled', 'M87', '{"match_number":87,"home":{"type":"group_pos","group":"K","pos":1},"away":{"type":"best_third","groups":["D","E","I","J","L"]},"label":"1º K vs 3º"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M87');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r32', timestamptz '2026-07-03T18:00:00+00', 'AT&T Stadium, Dallas', 'scheduled', 'M88', '{"match_number":88,"home":{"type":"group_pos","group":"D","pos":2},"away":{"type":"group_pos","group":"G","pos":2},"label":"2º D vs 2º G"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M88');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-04T21:00:00+00', 'Lincoln Financial Field, Philadelphia', 'scheduled', 'M89', '{"match_number":89,"home":{"type":"winner","match":74},"away":{"type":"winner","match":77},"label":"Ganador M74 vs M77"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M89');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-04T17:00:00+00', 'NRG Stadium, Houston', 'scheduled', 'M90', '{"match_number":90,"home":{"type":"winner","match":73},"away":{"type":"winner","match":75},"label":"Ganador M73 vs M75"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M90');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-05T20:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled', 'M91', '{"match_number":91,"home":{"type":"winner","match":76},"away":{"type":"winner","match":78},"label":"Ganador M76 vs M78"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M91');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-06T00:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled', 'M92', '{"match_number":92,"home":{"type":"winner","match":79},"away":{"type":"winner","match":80},"label":"Ganador M79 vs M80"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M92');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-06T19:00:00+00', 'AT&T Stadium, Dallas', 'scheduled', 'M93', '{"match_number":93,"home":{"type":"winner","match":83},"away":{"type":"winner","match":84},"label":"Ganador M83 vs M84"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M93');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-07T00:00:00+00', 'Lumen Field, Seattle', 'scheduled', 'M94', '{"match_number":94,"home":{"type":"winner","match":81},"away":{"type":"winner","match":82},"label":"Ganador M81 vs M82"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M94');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-07T16:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled', 'M95', '{"match_number":95,"home":{"type":"winner","match":86},"away":{"type":"winner","match":88},"label":"Ganador M86 vs M88"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M95');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'r16', timestamptz '2026-07-07T20:00:00+00', 'BC Place, Vancouver', 'scheduled', 'M96', '{"match_number":96,"home":{"type":"winner","match":85},"away":{"type":"winner","match":87},"label":"Ganador M85 vs M87"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M96');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'qf', timestamptz '2026-07-09T20:00:00+00', 'Gillette Stadium, Boston', 'scheduled', 'M97', '{"match_number":97,"home":{"type":"winner","match":89},"away":{"type":"winner","match":90},"label":"Ganador M89 vs M90"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M97');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'qf', timestamptz '2026-07-10T19:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled', 'M98', '{"match_number":98,"home":{"type":"winner","match":93},"away":{"type":"winner","match":94},"label":"Ganador M93 vs M94"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M98');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'qf', timestamptz '2026-07-11T21:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled', 'M99', '{"match_number":99,"home":{"type":"winner","match":91},"away":{"type":"winner","match":92},"label":"Ganador M91 vs M92"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M99');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'qf', timestamptz '2026-07-12T01:00:00+00', 'Arrowhead Stadium, Kansas City', 'scheduled', 'M100', '{"match_number":100,"home":{"type":"winner","match":95},"away":{"type":"winner","match":96},"label":"Ganador M95 vs M96"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M100');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'sf', timestamptz '2026-07-14T19:00:00+00', 'AT&T Stadium, Dallas', 'scheduled', 'M101', '{"match_number":101,"home":{"type":"winner","match":97},"away":{"type":"winner","match":98},"label":"Ganador M97 vs M98"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M101');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'sf', timestamptz '2026-07-15T19:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled', 'M102', '{"match_number":102,"home":{"type":"winner","match":99},"away":{"type":"winner","match":100},"label":"Ganador M99 vs M100"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M102');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'third', timestamptz '2026-07-18T21:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled', 'M103', '{"match_number":103,"home":{"type":"loser","match":101},"away":{"type":"loser","match":102},"label":"Perdedor M101 vs M102"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M103');

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, 'final', timestamptz '2026-07-19T19:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled', 'M104', '{"match_number":104,"home":{"type":"winner","match":101},"away":{"type":"winner","match":102},"label":"Ganador M101 vs M102"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = 'M104');
