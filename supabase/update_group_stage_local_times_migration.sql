-- Actualizar horarios (hora local) y sedes de fase de grupos
-- Ejecutar en SQL Editor de Supabase si ya tienes los partidos cargados

UPDATE matches m
SET match_date = timestamptz '2026-06-11T19:00:00+00',
    venue = 'Estadio Azteca, Ciudad de México'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MEX'
  AND a.code = 'RSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-12T02:00:00+00',
    venue = 'Estadio Akron, Guadalajara'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'KOR'
  AND a.code = 'CZE'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-12T19:00:00+00',
    venue = 'BMO Field, Toronto'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CAN'
  AND a.code = 'BIH'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-13T01:00:00+00',
    venue = 'SoFi Stadium, Los Angeles'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'USA'
  AND a.code = 'PAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T01:00:00+00',
    venue = 'Gillette Stadium, Boston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'HAI'
  AND a.code = 'SCO'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T04:00:00+00',
    venue = 'BC Place, Vancouver'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUS'
  AND a.code = 'TUR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-13T22:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-13T19:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'QAT'
  AND a.code = 'SUI'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T23:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CIV'
  AND a.code = 'ECU'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T17:00:00+00',
    venue = 'NRG Stadium, Houston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-14T20:00:00+00',
    venue = 'AT&T Stadium, Dallas'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T02:00:00+00',
    venue = 'Estadio BBVA, Monterrey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SWE'
  AND a.code = 'TUN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T22:00:00+00',
    venue = 'Hard Rock Stadium, Miami'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'KSA'
  AND a.code = 'URU'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T16:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ESP'
  AND a.code = 'CPV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-16T01:00:00+00',
    venue = 'SoFi Stadium, Los Angeles'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'IRN'
  AND a.code = 'NZL'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-15T19:00:00+00',
    venue = 'Lumen Field, Seattle'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BEL'
  AND a.code = 'EGY'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-16T19:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'FRA'
  AND a.code = 'SEN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-16T22:00:00+00',
    venue = 'Gillette Stadium, Boston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'IRQ'
  AND a.code = 'NOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T01:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ARG'
  AND a.code = 'ALG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T04:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUT'
  AND a.code = 'JOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T23:00:00+00',
    venue = 'BMO Field, Toronto'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GHA'
  AND a.code = 'PAN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T20:00:00+00',
    venue = 'AT&T Stadium, Dallas'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ENG'
  AND a.code = 'CRO'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-17T17:00:00+00',
    venue = 'NRG Stadium, Houston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'POR'
  AND a.code = 'COD'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T02:00:00+00',
    venue = 'Estadio Azteca, Ciudad de México'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'UZB'
  AND a.code = 'COL'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T16:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CZE'
  AND a.code = 'RSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T19:00:00+00',
    venue = 'SoFi Stadium, Los Angeles'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SUI'
  AND a.code = 'BIH'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-18T22:00:00+00',
    venue = 'BC Place, Vancouver'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CAN'
  AND a.code = 'QAT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-19T01:00:00+00',
    venue = 'Estadio Akron, Guadalajara'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MEX'
  AND a.code = 'KOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T01:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'HAI'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-19T22:00:00+00',
    venue = 'Gillette Stadium, Boston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SCO'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T03:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUR'
  AND a.code = 'PAR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-19T19:00:00+00',
    venue = 'Lumen Field, Seattle'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'USA'
  AND a.code = 'AUS'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T20:00:00+00',
    venue = 'BMO Field, Toronto'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CIV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T00:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ECU'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-20T17:00:00+00',
    venue = 'NRG Stadium, Houston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'SWE'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T04:00:00+00',
    venue = 'Estadio BBVA, Monterrey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUN'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T22:00:00+00',
    venue = 'Hard Rock Stadium, Miami'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'URU'
  AND a.code = 'CPV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T16:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ESP'
  AND a.code = 'KSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-21T19:00:00+00',
    venue = 'SoFi Stadium, Los Angeles'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BEL'
  AND a.code = 'IRN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-22T01:00:00+00',
    venue = 'BC Place, Vancouver'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NZL'
  AND a.code = 'EGY'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T00:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NOR'
  AND a.code = 'SEN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-22T21:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'FRA'
  AND a.code = 'IRQ'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-22T17:00:00+00',
    venue = 'AT&T Stadium, Dallas'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ARG'
  AND a.code = 'AUT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T03:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JOR'
  AND a.code = 'ALG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T20:00:00+00',
    venue = 'Gillette Stadium, Boston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ENG'
  AND a.code = 'GHA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T23:00:00+00',
    venue = 'BMO Field, Toronto'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAN'
  AND a.code = 'CRO'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-23T17:00:00+00',
    venue = 'NRG Stadium, Houston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'POR'
  AND a.code = 'UZB'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T02:00:00+00',
    venue = 'Estadio Akron, Guadalajara'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COL'
  AND a.code = 'COD'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T22:00:00+00',
    venue = 'Hard Rock Stadium, Miami'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SCO'
  AND a.code = 'BRA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T22:00:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MAR'
  AND a.code = 'HAI'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T19:00:00+00',
    venue = 'BC Place, Vancouver'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SUI'
  AND a.code = 'CAN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-24T19:00:00+00',
    venue = 'Lumen Field, Seattle'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BIH'
  AND a.code = 'QAT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T01:00:00+00',
    venue = 'Estadio Azteca, Ciudad de México'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CZE'
  AND a.code = 'MEX'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T01:00:00+00',
    venue = 'Estadio BBVA, Monterrey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'RSA'
  AND a.code = 'KOR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T20:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CUW'
  AND a.code = 'CIV'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T20:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ECU'
  AND a.code = 'GER'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T23:00:00+00',
    venue = 'AT&T Stadium, Dallas'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JPN'
  AND a.code = 'SWE'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-25T23:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUN'
  AND a.code = 'NED'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T02:00:00+00',
    venue = 'SoFi Stadium, Los Angeles'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUR'
  AND a.code = 'USA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T02:00:00+00',
    venue = 'Levi''s Stadium, San Francisco Bay Area'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAR'
  AND a.code = 'AUS'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T19:00:00+00',
    venue = 'Gillette Stadium, Boston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NOR'
  AND a.code = 'FRA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-26T19:00:00+00',
    venue = 'BMO Field, Toronto'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SEN'
  AND a.code = 'IRQ'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T03:00:00+00',
    venue = 'Lumen Field, Seattle'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'EGY'
  AND a.code = 'IRN'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T03:00:00+00',
    venue = 'BC Place, Vancouver'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NZL'
  AND a.code = 'BEL'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T00:00:00+00',
    venue = 'NRG Stadium, Houston'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CPV'
  AND a.code = 'KSA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T00:00:00+00',
    venue = 'Estadio Akron, Guadalajara'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'URU'
  AND a.code = 'ESP'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T21:00:00+00',
    venue = 'MetLife Stadium, New York/New Jersey'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAN'
  AND a.code = 'ENG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T21:00:00+00',
    venue = 'Lincoln Financial Field, Philadelphia'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CRO'
  AND a.code = 'GHA'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-28T02:00:00+00',
    venue = 'Arrowhead Stadium, Kansas City'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ALG'
  AND a.code = 'AUT'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-28T02:00:00+00',
    venue = 'AT&T Stadium, Dallas'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JOR'
  AND a.code = 'ARG'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T23:30:00+00',
    venue = 'Hard Rock Stadium, Miami'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COL'
  AND a.code = 'POR'
  AND m.phase = 'group';

UPDATE matches m
SET match_date = timestamptz '2026-06-27T23:30:00+00',
    venue = 'Mercedes-Benz Stadium, Atlanta'
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COD'
  AND a.code = 'UZB'
  AND m.phase = 'group';
