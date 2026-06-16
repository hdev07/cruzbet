-- Actualizar horarios (hora local) y sedes de fase de grupos
-- Ejecutar en SQL Editor de Supabase si ya tienes los partidos cargados

UPDATE matches m
SET match_date = timestamptz '2026-06-11T19:00:00+00',
    venue = 'Estadio Azteca, Ciudad de México',
    bracket_key = 'M1',
    bracket_meta = '{"match_number":1}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MEX'
  AND a.code = 'RSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-12T02:00:00+00',
    venue = 'Estadio Akron, Guadalajara',
    bracket_key = 'M2',
    bracket_meta = '{"match_number":2}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'KOR'
  AND a.code = 'CZE'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-12T19:00:00+00',
    venue = 'BMO Field, Toronto',
    bracket_key = 'M3',
    bracket_meta = '{"match_number":3}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CAN'
  AND a.code = 'BIH'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-13T01:00:00+00',
    venue = 'SoFi Stadium, Los Angeles',
    bracket_key = 'M4',
    bracket_meta = '{"match_number":4}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'USA'
  AND a.code = 'PAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T01:00:00+00',
    venue = 'Gillette Stadium, Boston',
    bracket_key = 'M7',
    bracket_meta = '{"match_number":7}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'HAI'
  AND a.code = 'SCO'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T04:00:00+00',
    venue = 'BC Place, Vancouver',
    bracket_key = 'M8',
    bracket_meta = '{"match_number":8}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUS'
  AND a.code = 'TUR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-13T22:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey',
    bracket_key = 'M6',
    bracket_meta = '{"match_number":6}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-13T19:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area',
    bracket_key = 'M5',
    bracket_meta = '{"match_number":5}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'QAT'
  AND a.code = 'SUI'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T23:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia',
    bracket_key = 'M11',
    bracket_meta = '{"match_number":11}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CIV'
  AND a.code = 'ECU'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T17:00:00+00',
    venue = 'NRG Stadium, Houston',
    bracket_key = 'M9',
    bracket_meta = '{"match_number":9}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T20:00:00+00',
    venue = 'AT&T Stadium, Dallas',
    bracket_key = 'M10',
    bracket_meta = '{"match_number":10}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T02:00:00+00',
    venue = 'Estadio BBVA, Monterrey',
    bracket_key = 'M12',
    bracket_meta = '{"match_number":12}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SWE'
  AND a.code = 'TUN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T22:00:00+00',
    venue = 'Hard Rock Stadium, Miami',
    bracket_key = 'M13',
    bracket_meta = '{"match_number":13}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'KSA'
  AND a.code = 'URU'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T16:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta',
    bracket_key = 'M14',
    bracket_meta = '{"match_number":14}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ESP'
  AND a.code = 'CPV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-16T01:00:00+00',
    venue = 'SoFi Stadium, Los Angeles',
    bracket_key = 'M15',
    bracket_meta = '{"match_number":15}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'IRN'
  AND a.code = 'NZL'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T19:00:00+00',
    venue = 'Lumen Field, Seattle',
    bracket_key = 'M16',
    bracket_meta = '{"match_number":16}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BEL'
  AND a.code = 'EGY'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-16T19:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey',
    bracket_key = 'M17',
    bracket_meta = '{"match_number":17}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'FRA'
  AND a.code = 'SEN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-16T22:00:00+00',
    venue = 'Gillette Stadium, Boston',
    bracket_key = 'M18',
    bracket_meta = '{"match_number":18}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'IRQ'
  AND a.code = 'NOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T01:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City',
    bracket_key = 'M19',
    bracket_meta = '{"match_number":19}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ARG'
  AND a.code = 'ALG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T04:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area',
    bracket_key = 'M20',
    bracket_meta = '{"match_number":20}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUT'
  AND a.code = 'JOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T23:00:00+00',
    venue = 'BMO Field, Toronto',
    bracket_key = 'M21',
    bracket_meta = '{"match_number":21}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GHA'
  AND a.code = 'PAN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T20:00:00+00',
    venue = 'AT&T Stadium, Dallas',
    bracket_key = 'M22',
    bracket_meta = '{"match_number":22}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ENG'
  AND a.code = 'CRO'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T17:00:00+00',
    venue = 'NRG Stadium, Houston',
    bracket_key = 'M23',
    bracket_meta = '{"match_number":23}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'POR'
  AND a.code = 'COD'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T02:00:00+00',
    venue = 'Estadio Azteca, Ciudad de México',
    bracket_key = 'M24',
    bracket_meta = '{"match_number":24}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'UZB'
  AND a.code = 'COL'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T16:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta',
    bracket_key = 'M25',
    bracket_meta = '{"match_number":25}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CZE'
  AND a.code = 'RSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T19:00:00+00',
    venue = 'SoFi Stadium, Los Angeles',
    bracket_key = 'M26',
    bracket_meta = '{"match_number":26}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SUI'
  AND a.code = 'BIH'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T22:00:00+00',
    venue = 'BC Place, Vancouver',
    bracket_key = 'M27',
    bracket_meta = '{"match_number":27}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CAN'
  AND a.code = 'QAT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-19T01:00:00+00',
    venue = 'Estadio Akron, Guadalajara',
    bracket_key = 'M28',
    bracket_meta = '{"match_number":28}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MEX'
  AND a.code = 'KOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T01:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia',
    bracket_key = 'M29',
    bracket_meta = '{"match_number":29}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'HAI'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-19T22:00:00+00',
    venue = 'Gillette Stadium, Boston',
    bracket_key = 'M30',
    bracket_meta = '{"match_number":30}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SCO'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T03:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area',
    bracket_key = 'M31',
    bracket_meta = '{"match_number":31}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUR'
  AND a.code = 'PAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-19T19:00:00+00',
    venue = 'Lumen Field, Seattle',
    bracket_key = 'M32',
    bracket_meta = '{"match_number":32}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'USA'
  AND a.code = 'AUS'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T20:00:00+00',
    venue = 'BMO Field, Toronto',
    bracket_key = 'M33',
    bracket_meta = '{"match_number":33}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CIV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T00:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City',
    bracket_key = 'M34',
    bracket_meta = '{"match_number":34}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ECU'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T17:00:00+00',
    venue = 'NRG Stadium, Houston',
    bracket_key = 'M35',
    bracket_meta = '{"match_number":35}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'SWE'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T04:00:00+00',
    venue = 'Estadio BBVA, Monterrey',
    bracket_key = 'M36',
    bracket_meta = '{"match_number":36}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUN'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T22:00:00+00',
    venue = 'Hard Rock Stadium, Miami',
    bracket_key = 'M37',
    bracket_meta = '{"match_number":37}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'URU'
  AND a.code = 'CPV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T16:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta',
    bracket_key = 'M38',
    bracket_meta = '{"match_number":38}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ESP'
  AND a.code = 'KSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T19:00:00+00',
    venue = 'SoFi Stadium, Los Angeles',
    bracket_key = 'M39',
    bracket_meta = '{"match_number":39}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BEL'
  AND a.code = 'IRN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-22T01:00:00+00',
    venue = 'BC Place, Vancouver',
    bracket_key = 'M40',
    bracket_meta = '{"match_number":40}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NZL'
  AND a.code = 'EGY'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T00:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey',
    bracket_key = 'M41',
    bracket_meta = '{"match_number":41}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NOR'
  AND a.code = 'SEN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-22T21:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia',
    bracket_key = 'M42',
    bracket_meta = '{"match_number":42}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'FRA'
  AND a.code = 'IRQ'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-22T17:00:00+00',
    venue = 'AT&T Stadium, Dallas',
    bracket_key = 'M43',
    bracket_meta = '{"match_number":43}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ARG'
  AND a.code = 'AUT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T03:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area',
    bracket_key = 'M44',
    bracket_meta = '{"match_number":44}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JOR'
  AND a.code = 'ALG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T20:00:00+00',
    venue = 'Gillette Stadium, Boston',
    bracket_key = 'M45',
    bracket_meta = '{"match_number":45}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ENG'
  AND a.code = 'GHA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T23:00:00+00',
    venue = 'BMO Field, Toronto',
    bracket_key = 'M46',
    bracket_meta = '{"match_number":46}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAN'
  AND a.code = 'CRO'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T17:00:00+00',
    venue = 'NRG Stadium, Houston',
    bracket_key = 'M47',
    bracket_meta = '{"match_number":47}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'POR'
  AND a.code = 'UZB'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T02:00:00+00',
    venue = 'Estadio Akron, Guadalajara',
    bracket_key = 'M48',
    bracket_meta = '{"match_number":48}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COL'
  AND a.code = 'COD'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T22:00:00+00',
    venue = 'Hard Rock Stadium, Miami',
    bracket_key = 'M49',
    bracket_meta = '{"match_number":49}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SCO'
  AND a.code = 'BRA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T22:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta',
    bracket_key = 'M50',
    bracket_meta = '{"match_number":50}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MAR'
  AND a.code = 'HAI'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T19:00:00+00',
    venue = 'BC Place, Vancouver',
    bracket_key = 'M51',
    bracket_meta = '{"match_number":51}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SUI'
  AND a.code = 'CAN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T19:00:00+00',
    venue = 'Lumen Field, Seattle',
    bracket_key = 'M52',
    bracket_meta = '{"match_number":52}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BIH'
  AND a.code = 'QAT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T01:00:00+00',
    venue = 'Estadio Azteca, Ciudad de México',
    bracket_key = 'M53',
    bracket_meta = '{"match_number":53}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CZE'
  AND a.code = 'MEX'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T01:00:00+00',
    venue = 'Estadio BBVA, Monterrey',
    bracket_key = 'M54',
    bracket_meta = '{"match_number":54}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'RSA'
  AND a.code = 'KOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T20:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia',
    bracket_key = 'M55',
    bracket_meta = '{"match_number":55}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CUW'
  AND a.code = 'CIV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T20:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey',
    bracket_key = 'M56',
    bracket_meta = '{"match_number":56}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ECU'
  AND a.code = 'GER'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T23:00:00+00',
    venue = 'AT&T Stadium, Dallas',
    bracket_key = 'M57',
    bracket_meta = '{"match_number":57}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JPN'
  AND a.code = 'SWE'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T23:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City',
    bracket_key = 'M58',
    bracket_meta = '{"match_number":58}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUN'
  AND a.code = 'NED'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T02:00:00+00',
    venue = 'SoFi Stadium, Los Angeles',
    bracket_key = 'M59',
    bracket_meta = '{"match_number":59}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUR'
  AND a.code = 'USA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T02:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area',
    bracket_key = 'M60',
    bracket_meta = '{"match_number":60}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAR'
  AND a.code = 'AUS'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T19:00:00+00',
    venue = 'Gillette Stadium, Boston',
    bracket_key = 'M61',
    bracket_meta = '{"match_number":61}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NOR'
  AND a.code = 'FRA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T19:00:00+00',
    venue = 'BMO Field, Toronto',
    bracket_key = 'M62',
    bracket_meta = '{"match_number":62}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SEN'
  AND a.code = 'IRQ'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T03:00:00+00',
    venue = 'Lumen Field, Seattle',
    bracket_key = 'M63',
    bracket_meta = '{"match_number":63}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'EGY'
  AND a.code = 'IRN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T03:00:00+00',
    venue = 'BC Place, Vancouver',
    bracket_key = 'M64',
    bracket_meta = '{"match_number":64}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NZL'
  AND a.code = 'BEL'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T00:00:00+00',
    venue = 'NRG Stadium, Houston',
    bracket_key = 'M65',
    bracket_meta = '{"match_number":65}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CPV'
  AND a.code = 'KSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T00:00:00+00',
    venue = 'Estadio Akron, Guadalajara',
    bracket_key = 'M66',
    bracket_meta = '{"match_number":66}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'URU'
  AND a.code = 'ESP'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T21:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey',
    bracket_key = 'M67',
    bracket_meta = '{"match_number":67}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAN'
  AND a.code = 'ENG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T21:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia',
    bracket_key = 'M68',
    bracket_meta = '{"match_number":68}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CRO'
  AND a.code = 'GHA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-28T02:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City',
    bracket_key = 'M69',
    bracket_meta = '{"match_number":69}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ALG'
  AND a.code = 'AUT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-28T02:00:00+00',
    venue = 'AT&T Stadium, Dallas',
    bracket_key = 'M70',
    bracket_meta = '{"match_number":70}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JOR'
  AND a.code = 'ARG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T23:30:00+00',
    venue = 'Hard Rock Stadium, Miami',
    bracket_key = 'M71',
    bracket_meta = '{"match_number":71}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COL'
  AND a.code = 'POR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T23:30:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta',
    bracket_key = 'M72',
    bracket_meta = '{"match_number":72}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COD'
  AND a.code = 'UZB'
  AND m.phase = 'group';
