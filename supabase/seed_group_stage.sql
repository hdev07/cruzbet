-- Seed: Mundial 2026 — Fase de grupos (48 equipos, 72 partidos)
-- Ejecutar en Supabase SQL Editor después de schema.sql
-- Horarios convertidos de ET (EDT, UTC-4) a timestamptz UTC

INSERT INTO teams (code, name, flag_url, group_name)
VALUES
  ('MEX', 'México', 'https://flagcdn.com/w40/mx.png', 'A'),
  ('RSA', 'Sudáfrica', 'https://flagcdn.com/w40/za.png', 'A'),
  ('KOR', 'Corea del Sur', 'https://flagcdn.com/w40/kr.png', 'A'),
  ('CZE', 'Chequia', 'https://flagcdn.com/w40/cz.png', 'A'),
  ('CAN', 'Canadá', 'https://flagcdn.com/w40/ca.png', 'B'),
  ('SUI', 'Suiza', 'https://flagcdn.com/w40/ch.png', 'B'),
  ('QAT', 'Qatar', 'https://flagcdn.com/w40/qa.png', 'B'),
  ('BIH', 'Bosnia y Herzegovina', 'https://flagcdn.com/w40/ba.png', 'B'),
  ('BRA', 'Brasil', 'https://flagcdn.com/w40/br.png', 'C'),
  ('MAR', 'Marruecos', 'https://flagcdn.com/w40/ma.png', 'C'),
  ('HAI', 'Haití', 'https://flagcdn.com/w40/ht.png', 'C'),
  ('SCO', 'Escocia', 'https://flagcdn.com/w40/gb-sct.png', 'C'),
  ('USA', 'Estados Unidos', 'https://flagcdn.com/w40/us.png', 'D'),
  ('PAR', 'Paraguay', 'https://flagcdn.com/w40/py.png', 'D'),
  ('AUS', 'Australia', 'https://flagcdn.com/w40/au.png', 'D'),
  ('TUR', 'Turquía', 'https://flagcdn.com/w40/tr.png', 'D'),
  ('GER', 'Alemania', 'https://flagcdn.com/w40/de.png', 'E'),
  ('CUW', 'Curazao', 'https://flagcdn.com/w40/cw.png', 'E'),
  ('CIV', 'Costa de Marfil', 'https://flagcdn.com/w40/ci.png', 'E'),
  ('ECU', 'Ecuador', 'https://flagcdn.com/w40/ec.png', 'E'),
  ('NED', 'Países Bajos', 'https://flagcdn.com/w40/nl.png', 'F'),
  ('JPN', 'Japón', 'https://flagcdn.com/w40/jp.png', 'F'),
  ('TUN', 'Túnez', 'https://flagcdn.com/w40/tn.png', 'F'),
  ('SWE', 'Suecia', 'https://flagcdn.com/w40/se.png', 'F'),
  ('BEL', 'Bélgica', 'https://flagcdn.com/w40/be.png', 'G'),
  ('EGY', 'Egipto', 'https://flagcdn.com/w40/eg.png', 'G'),
  ('IRN', 'Irán', 'https://flagcdn.com/w40/ir.png', 'G'),
  ('NZL', 'Nueva Zelanda', 'https://flagcdn.com/w40/nz.png', 'G'),
  ('ESP', 'España', 'https://flagcdn.com/w40/es.png', 'H'),
  ('CPV', 'Cabo Verde', 'https://flagcdn.com/w40/cv.png', 'H'),
  ('KSA', 'Arabia Saudita', 'https://flagcdn.com/w40/sa.png', 'H'),
  ('URU', 'Uruguay', 'https://flagcdn.com/w40/uy.png', 'H'),
  ('FRA', 'Francia', 'https://flagcdn.com/w40/fr.png', 'I'),
  ('SEN', 'Senegal', 'https://flagcdn.com/w40/sn.png', 'I'),
  ('NOR', 'Noruega', 'https://flagcdn.com/w40/no.png', 'I'),
  ('IRQ', 'Irak', 'https://flagcdn.com/w40/iq.png', 'I'),
  ('ARG', 'Argentina', 'https://flagcdn.com/w40/ar.png', 'J'),
  ('ALG', 'Argelia', 'https://flagcdn.com/w40/dz.png', 'J'),
  ('AUT', 'Austria', 'https://flagcdn.com/w40/at.png', 'J'),
  ('JOR', 'Jordania', 'https://flagcdn.com/w40/jo.png', 'J'),
  ('POR', 'Portugal', 'https://flagcdn.com/w40/pt.png', 'K'),
  ('UZB', 'Uzbekistán', 'https://flagcdn.com/w40/uz.png', 'K'),
  ('COL', 'Colombia', 'https://flagcdn.com/w40/co.png', 'K'),
  ('COD', 'RD Congo', 'https://flagcdn.com/w40/cd.png', 'K'),
  ('ENG', 'Inglaterra', 'https://flagcdn.com/w40/gb-eng.png', 'L'),
  ('CRO', 'Croacia', 'https://flagcdn.com/w40/hr.png', 'L'),
  ('GHA', 'Ghana', 'https://flagcdn.com/w40/gh.png', 'L'),
  ('PAN', 'Panamá', 'https://flagcdn.com/w40/pa.png', 'L')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag_url = EXCLUDED.flag_url,
  group_name = EXCLUDED.group_name;

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-11T19:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'MEX' AND a.code = 'RSA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'MEX' AND at.code = 'RSA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-12T02:00:00+00', 'Estadio Akron, Guadalajara', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'KOR' AND a.code = 'CZE'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'KOR' AND at.code = 'CZE' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-12T19:00:00+00', 'BMO Field, Toronto', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CAN' AND a.code = 'BIH'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CAN' AND at.code = 'BIH' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-13T01:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'USA' AND a.code = 'PAR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'USA' AND at.code = 'PAR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-14T01:00:00+00', 'Gillette Stadium, Boston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'HAI' AND a.code = 'SCO'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'HAI' AND at.code = 'SCO' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-13T04:00:00+00', 'BC Place, Vancouver', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'AUS' AND a.code = 'TUR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'AUS' AND at.code = 'TUR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-13T22:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'BRA' AND a.code = 'MAR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'BRA' AND at.code = 'MAR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-13T19:00:00+00', 'Levi''s Stadium, San Francisco', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'QAT' AND a.code = 'SUI'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'QAT' AND at.code = 'SUI' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-14T23:00:00+00', 'Lincoln Financial Field, Philadelphia', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CIV' AND a.code = 'ECU'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CIV' AND at.code = 'ECU' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-14T17:00:00+00', 'NRG Stadium, Houston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'GER' AND a.code = 'CUW'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'GER' AND at.code = 'CUW' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-14T20:00:00+00', 'AT&T Stadium, Dallas', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'NED' AND a.code = 'JPN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'NED' AND at.code = 'JPN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-15T02:00:00+00', 'Estadio BBVA, Monterrey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'SWE' AND a.code = 'TUN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'SWE' AND at.code = 'TUN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-15T22:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'KSA' AND a.code = 'URU'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'KSA' AND at.code = 'URU' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-15T16:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ESP' AND a.code = 'CPV'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ESP' AND at.code = 'CPV' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-16T01:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'IRN' AND a.code = 'NZL'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'IRN' AND at.code = 'NZL' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-15T19:00:00+00', 'Lumen Field, Seattle', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'BEL' AND a.code = 'EGY'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'BEL' AND at.code = 'EGY' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-16T19:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'FRA' AND a.code = 'SEN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'FRA' AND at.code = 'SEN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-16T22:00:00+00', 'Gillette Stadium, Boston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'IRQ' AND a.code = 'NOR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'IRQ' AND at.code = 'NOR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-17T01:00:00+00', 'Arrowhead Stadium, Kansas City', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ARG' AND a.code = 'ALG'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ARG' AND at.code = 'ALG' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-16T04:00:00+00', 'Levi''s Stadium, San Francisco', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'AUT' AND a.code = 'JOR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'AUT' AND at.code = 'JOR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-17T23:00:00+00', 'BMO Field, Toronto', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'GHA' AND a.code = 'PAN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'GHA' AND at.code = 'PAN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-17T20:00:00+00', 'AT&T Stadium, Dallas', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ENG' AND a.code = 'CRO'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ENG' AND at.code = 'CRO' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-17T17:00:00+00', 'NRG Stadium, Houston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'POR' AND a.code = 'COD'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'POR' AND at.code = 'COD' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-18T02:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'UZB' AND a.code = 'COL'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'UZB' AND at.code = 'COL' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-18T16:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CZE' AND a.code = 'RSA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CZE' AND at.code = 'RSA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-18T19:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'SUI' AND a.code = 'BIH'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'SUI' AND at.code = 'BIH' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-18T22:00:00+00', 'BC Place, Vancouver', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CAN' AND a.code = 'QAT'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CAN' AND at.code = 'QAT' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-19T01:00:00+00', 'Estadio Akron, Guadalajara', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'MEX' AND a.code = 'KOR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'MEX' AND at.code = 'KOR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-20T01:00:00+00', 'Lincoln Financial Field, Philadelphia', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'BRA' AND a.code = 'HAI'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'BRA' AND at.code = 'HAI' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-19T22:00:00+00', 'Gillette Stadium, Boston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'SCO' AND a.code = 'MAR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'SCO' AND at.code = 'MAR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-20T03:00:00+00', 'Levi''s Stadium, San Francisco', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'TUR' AND a.code = 'PAR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'TUR' AND at.code = 'PAR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-19T19:00:00+00', 'Lumen Field, Seattle', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'USA' AND a.code = 'AUS'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'USA' AND at.code = 'AUS' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-20T20:00:00+00', 'BMO Field, Toronto', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'GER' AND a.code = 'CIV'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'GER' AND at.code = 'CIV' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-21T00:00:00+00', 'Arrowhead Stadium, Kansas City', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ECU' AND a.code = 'CUW'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ECU' AND at.code = 'CUW' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-20T17:00:00+00', 'NRG Stadium, Houston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'NED' AND a.code = 'SWE'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'NED' AND at.code = 'SWE' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-20T04:00:00+00', 'Estadio BBVA, Monterrey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'TUN' AND a.code = 'JPN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'TUN' AND at.code = 'JPN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-21T22:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'URU' AND a.code = 'CPV'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'URU' AND at.code = 'CPV' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-21T16:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ESP' AND a.code = 'KSA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ESP' AND at.code = 'KSA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-21T19:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'BEL' AND a.code = 'IRN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'BEL' AND at.code = 'IRN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-22T01:00:00+00', 'BC Place, Vancouver', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'NZL' AND a.code = 'EGY'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'NZL' AND at.code = 'EGY' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-23T00:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'NOR' AND a.code = 'SEN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'NOR' AND at.code = 'SEN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-22T21:00:00+00', 'Lincoln Financial Field, Philadelphia', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'FRA' AND a.code = 'IRQ'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'FRA' AND at.code = 'IRQ' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-22T17:00:00+00', 'AT&T Stadium, Dallas', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ARG' AND a.code = 'AUT'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ARG' AND at.code = 'AUT' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-23T03:00:00+00', 'Levi''s Stadium, San Francisco', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'JOR' AND a.code = 'ALG'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'JOR' AND at.code = 'ALG' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-23T20:00:00+00', 'Gillette Stadium, Boston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ENG' AND a.code = 'GHA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ENG' AND at.code = 'GHA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-23T23:00:00+00', 'BMO Field, Toronto', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'PAN' AND a.code = 'CRO'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'PAN' AND at.code = 'CRO' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-23T17:00:00+00', 'NRG Stadium, Houston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'POR' AND a.code = 'UZB'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'POR' AND at.code = 'UZB' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-24T02:00:00+00', 'Estadio Akron, Guadalajara', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'COL' AND a.code = 'COD'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'COL' AND at.code = 'COD' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-24T22:00:00+00', 'Hard Rock Stadium, Miami', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'SCO' AND a.code = 'BRA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'SCO' AND at.code = 'BRA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-24T22:00:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'MAR' AND a.code = 'HAI'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'MAR' AND at.code = 'HAI' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-24T19:00:00+00', 'BC Place, Vancouver', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'SUI' AND a.code = 'CAN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'SUI' AND at.code = 'CAN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-24T19:00:00+00', 'Lumen Field, Seattle', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'BIH' AND a.code = 'QAT'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'BIH' AND at.code = 'QAT' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-25T01:00:00+00', 'Estadio Azteca, Ciudad de México', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CZE' AND a.code = 'MEX'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CZE' AND at.code = 'MEX' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-25T01:00:00+00', 'Estadio BBVA, Monterrey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'RSA' AND a.code = 'KOR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'RSA' AND at.code = 'KOR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-25T20:00:00+00', 'Lincoln Financial Field, Philadelphia', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CUW' AND a.code = 'CIV'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CUW' AND at.code = 'CIV' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-25T20:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ECU' AND a.code = 'GER'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ECU' AND at.code = 'GER' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-25T23:00:00+00', 'AT&T Stadium, Dallas', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'JPN' AND a.code = 'SWE'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'JPN' AND at.code = 'SWE' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-25T23:00:00+00', 'Arrowhead Stadium, Kansas City', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'TUN' AND a.code = 'NED'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'TUN' AND at.code = 'NED' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-26T02:00:00+00', 'SoFi Stadium, Los Angeles', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'TUR' AND a.code = 'USA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'TUR' AND at.code = 'USA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-26T02:00:00+00', 'Levi''s Stadium, San Francisco', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'PAR' AND a.code = 'AUS'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'PAR' AND at.code = 'AUS' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-26T19:00:00+00', 'Gillette Stadium, Boston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'NOR' AND a.code = 'FRA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'NOR' AND at.code = 'FRA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-26T19:00:00+00', 'BMO Field, Toronto', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'SEN' AND a.code = 'IRQ'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'SEN' AND at.code = 'IRQ' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T03:00:00+00', 'Lumen Field, Seattle', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'EGY' AND a.code = 'IRN'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'EGY' AND at.code = 'IRN' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T03:00:00+00', 'BC Place, Vancouver', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'NZL' AND a.code = 'BEL'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'NZL' AND at.code = 'BEL' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T00:00:00+00', 'NRG Stadium, Houston', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CPV' AND a.code = 'KSA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CPV' AND at.code = 'KSA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T00:00:00+00', 'Estadio Akron, Guadalajara', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'URU' AND a.code = 'ESP'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'URU' AND at.code = 'ESP' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T21:00:00+00', 'MetLife Stadium, New York/New Jersey', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'PAN' AND a.code = 'ENG'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'PAN' AND at.code = 'ENG' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T21:00:00+00', 'Lincoln Financial Field, Philadelphia', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'CRO' AND a.code = 'GHA'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'CRO' AND at.code = 'GHA' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-28T02:00:00+00', 'Arrowhead Stadium, Kansas City', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'ALG' AND a.code = 'AUT'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'ALG' AND at.code = 'AUT' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-28T02:00:00+00', 'AT&T Stadium, Dallas', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'JOR' AND a.code = 'ARG'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'JOR' AND at.code = 'ARG' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T23:30:00+00', 'Hard Rock Stadium, Miami', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'COL' AND a.code = 'POR'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'COL' AND at.code = 'POR' AND m.phase = 'group'
  );

INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '2026-06-27T23:30:00+00', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'
FROM teams h, teams a
WHERE h.code = 'COD' AND a.code = 'UZB'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = 'COD' AND at.code = 'UZB' AND m.phase = 'group'
  );
