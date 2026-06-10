/**
 * Genera supabase/seed_group_stage.sql con los 72 partidos de fase de grupos
 * Fuente: calendario oficial FIFA World Cup 2026 (grupos A–L)
 */

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const teams = [
  { code: 'MEX', name: 'México', group: 'A', flag: 'mx' },
  { code: 'RSA', name: 'Sudáfrica', group: 'A', flag: 'za' },
  { code: 'KOR', name: 'Corea del Sur', group: 'A', flag: 'kr' },
  { code: 'CZE', name: 'Chequia', group: 'A', flag: 'cz' },
  { code: 'CAN', name: 'Canadá', group: 'B', flag: 'ca' },
  { code: 'SUI', name: 'Suiza', group: 'B', flag: 'ch' },
  { code: 'QAT', name: 'Qatar', group: 'B', flag: 'qa' },
  { code: 'BIH', name: 'Bosnia y Herzegovina', group: 'B', flag: 'ba' },
  { code: 'BRA', name: 'Brasil', group: 'C', flag: 'br' },
  { code: 'MAR', name: 'Marruecos', group: 'C', flag: 'ma' },
  { code: 'HAI', name: 'Haití', group: 'C', flag: 'ht' },
  { code: 'SCO', name: 'Escocia', group: 'C', flag: 'gb-sct' },
  { code: 'USA', name: 'Estados Unidos', group: 'D', flag: 'us' },
  { code: 'PAR', name: 'Paraguay', group: 'D', flag: 'py' },
  { code: 'AUS', name: 'Australia', group: 'D', flag: 'au' },
  { code: 'TUR', name: 'Turquía', group: 'D', flag: 'tr' },
  { code: 'GER', name: 'Alemania', group: 'E', flag: 'de' },
  { code: 'CUW', name: 'Curazao', group: 'E', flag: 'cw' },
  { code: 'CIV', name: 'Costa de Marfil', group: 'E', flag: 'ci' },
  { code: 'ECU', name: 'Ecuador', group: 'E', flag: 'ec' },
  { code: 'NED', name: 'Países Bajos', group: 'F', flag: 'nl' },
  { code: 'JPN', name: 'Japón', group: 'F', flag: 'jp' },
  { code: 'TUN', name: 'Túnez', group: 'F', flag: 'tn' },
  { code: 'SWE', name: 'Suecia', group: 'F', flag: 'se' },
  { code: 'BEL', name: 'Bélgica', group: 'G', flag: 'be' },
  { code: 'EGY', name: 'Egipto', group: 'G', flag: 'eg' },
  { code: 'IRN', name: 'Irán', group: 'G', flag: 'ir' },
  { code: 'NZL', name: 'Nueva Zelanda', group: 'G', flag: 'nz' },
  { code: 'ESP', name: 'España', group: 'H', flag: 'es' },
  { code: 'CPV', name: 'Cabo Verde', group: 'H', flag: 'cv' },
  { code: 'KSA', name: 'Arabia Saudita', group: 'H', flag: 'sa' },
  { code: 'URU', name: 'Uruguay', group: 'H', flag: 'uy' },
  { code: 'FRA', name: 'Francia', group: 'I', flag: 'fr' },
  { code: 'SEN', name: 'Senegal', group: 'I', flag: 'sn' },
  { code: 'NOR', name: 'Noruega', group: 'I', flag: 'no' },
  { code: 'IRQ', name: 'Irak', group: 'I', flag: 'iq' },
  { code: 'ARG', name: 'Argentina', group: 'J', flag: 'ar' },
  { code: 'ALG', name: 'Argelia', group: 'J', flag: 'dz' },
  { code: 'AUT', name: 'Austria', group: 'J', flag: 'at' },
  { code: 'JOR', name: 'Jordania', group: 'J', flag: 'jo' },
  { code: 'POR', name: 'Portugal', group: 'K', flag: 'pt' },
  { code: 'UZB', name: 'Uzbekistán', group: 'K', flag: 'uz' },
  { code: 'COL', name: 'Colombia', group: 'K', flag: 'co' },
  { code: 'COD', name: 'RD Congo', group: 'K', flag: 'cd' },
  { code: 'ENG', name: 'Inglaterra', group: 'L', flag: 'gb-eng' },
  { code: 'CRO', name: 'Croacia', group: 'L', flag: 'hr' },
  { code: 'GHA', name: 'Ghana', group: 'L', flag: 'gh' },
  { code: 'PAN', name: 'Panamá', group: 'L', flag: 'pa' },
]

// [home, away, group, date ET, time ET, venue]
const matches = [
  ['MEX', 'RSA', 'A', '2026-06-11', '15:00', 'Estadio Azteca, Ciudad de México'],
  ['KOR', 'CZE', 'A', '2026-06-11', '22:00', 'Estadio Akron, Guadalajara'],
  ['CAN', 'BIH', 'B', '2026-06-12', '15:00', 'BMO Field, Toronto'],
  ['USA', 'PAR', 'D', '2026-06-12', '21:00', 'SoFi Stadium, Los Angeles'],
  ['HAI', 'SCO', 'C', '2026-06-13', '21:00', 'Gillette Stadium, Boston'],
  ['AUS', 'TUR', 'D', '2026-06-13', '00:00', 'BC Place, Vancouver'],
  ['BRA', 'MAR', 'C', '2026-06-13', '18:00', 'MetLife Stadium, New York/New Jersey'],
  ['QAT', 'SUI', 'B', '2026-06-13', '15:00', "Levi's Stadium, San Francisco"],
  ['CIV', 'ECU', 'E', '2026-06-14', '19:00', 'Lincoln Financial Field, Philadelphia'],
  ['GER', 'CUW', 'E', '2026-06-14', '13:00', 'NRG Stadium, Houston'],
  ['NED', 'JPN', 'F', '2026-06-14', '16:00', 'AT&T Stadium, Dallas'],
  ['SWE', 'TUN', 'F', '2026-06-14', '22:00', 'Estadio BBVA, Monterrey'],
  ['KSA', 'URU', 'H', '2026-06-15', '18:00', 'Hard Rock Stadium, Miami'],
  ['ESP', 'CPV', 'H', '2026-06-15', '12:00', 'Mercedes-Benz Stadium, Atlanta'],
  ['IRN', 'NZL', 'G', '2026-06-15', '21:00', 'SoFi Stadium, Los Angeles'],
  ['BEL', 'EGY', 'G', '2026-06-15', '15:00', 'Lumen Field, Seattle'],
  ['FRA', 'SEN', 'I', '2026-06-16', '15:00', 'MetLife Stadium, New York/New Jersey'],
  ['IRQ', 'NOR', 'I', '2026-06-16', '18:00', 'Gillette Stadium, Boston'],
  ['ARG', 'ALG', 'J', '2026-06-16', '21:00', 'Arrowhead Stadium, Kansas City'],
  ['AUT', 'JOR', 'J', '2026-06-16', '00:00', "Levi's Stadium, San Francisco"],
  ['GHA', 'PAN', 'L', '2026-06-17', '19:00', 'BMO Field, Toronto'],
  ['ENG', 'CRO', 'L', '2026-06-17', '16:00', 'AT&T Stadium, Dallas'],
  ['POR', 'COD', 'K', '2026-06-17', '13:00', 'NRG Stadium, Houston'],
  ['UZB', 'COL', 'K', '2026-06-17', '22:00', 'Estadio Azteca, Ciudad de México'],
  ['CZE', 'RSA', 'A', '2026-06-18', '12:00', 'Mercedes-Benz Stadium, Atlanta'],
  ['SUI', 'BIH', 'B', '2026-06-18', '15:00', 'SoFi Stadium, Los Angeles'],
  ['CAN', 'QAT', 'B', '2026-06-18', '18:00', 'BC Place, Vancouver'],
  ['MEX', 'KOR', 'A', '2026-06-18', '21:00', 'Estadio Akron, Guadalajara'],
  ['BRA', 'HAI', 'C', '2026-06-19', '21:00', 'Lincoln Financial Field, Philadelphia'],
  ['SCO', 'MAR', 'C', '2026-06-19', '18:00', 'Gillette Stadium, Boston'],
  ['TUR', 'PAR', 'D', '2026-06-19', '23:00', "Levi's Stadium, San Francisco"],
  ['USA', 'AUS', 'D', '2026-06-19', '15:00', 'Lumen Field, Seattle'],
  ['GER', 'CIV', 'E', '2026-06-20', '16:00', 'BMO Field, Toronto'],
  ['ECU', 'CUW', 'E', '2026-06-20', '20:00', 'Arrowhead Stadium, Kansas City'],
  ['NED', 'SWE', 'F', '2026-06-20', '13:00', 'NRG Stadium, Houston'],
  ['TUN', 'JPN', 'F', '2026-06-20', '00:00', 'Estadio BBVA, Monterrey'],
  ['URU', 'CPV', 'H', '2026-06-21', '18:00', 'Hard Rock Stadium, Miami'],
  ['ESP', 'KSA', 'H', '2026-06-21', '12:00', 'Mercedes-Benz Stadium, Atlanta'],
  ['BEL', 'IRN', 'G', '2026-06-21', '15:00', 'SoFi Stadium, Los Angeles'],
  ['NZL', 'EGY', 'G', '2026-06-21', '21:00', 'BC Place, Vancouver'],
  ['NOR', 'SEN', 'I', '2026-06-22', '20:00', 'MetLife Stadium, New York/New Jersey'],
  ['FRA', 'IRQ', 'I', '2026-06-22', '17:00', 'Lincoln Financial Field, Philadelphia'],
  ['ARG', 'AUT', 'J', '2026-06-22', '13:00', 'AT&T Stadium, Dallas'],
  ['JOR', 'ALG', 'J', '2026-06-22', '23:00', "Levi's Stadium, San Francisco"],
  ['ENG', 'GHA', 'L', '2026-06-23', '16:00', 'Gillette Stadium, Boston'],
  ['PAN', 'CRO', 'L', '2026-06-23', '19:00', 'BMO Field, Toronto'],
  ['POR', 'UZB', 'K', '2026-06-23', '13:00', 'NRG Stadium, Houston'],
  ['COL', 'COD', 'K', '2026-06-23', '22:00', 'Estadio Akron, Guadalajara'],
  ['SCO', 'BRA', 'C', '2026-06-24', '18:00', 'Hard Rock Stadium, Miami'],
  ['MAR', 'HAI', 'C', '2026-06-24', '18:00', 'Mercedes-Benz Stadium, Atlanta'],
  ['SUI', 'CAN', 'B', '2026-06-24', '15:00', 'BC Place, Vancouver'],
  ['BIH', 'QAT', 'B', '2026-06-24', '15:00', 'Lumen Field, Seattle'],
  ['CZE', 'MEX', 'A', '2026-06-24', '21:00', 'Estadio Azteca, Ciudad de México'],
  ['RSA', 'KOR', 'A', '2026-06-24', '21:00', 'Estadio BBVA, Monterrey'],
  ['CUW', 'CIV', 'E', '2026-06-25', '16:00', 'Lincoln Financial Field, Philadelphia'],
  ['ECU', 'GER', 'E', '2026-06-25', '16:00', 'MetLife Stadium, New York/New Jersey'],
  ['JPN', 'SWE', 'F', '2026-06-25', '19:00', 'AT&T Stadium, Dallas'],
  ['TUN', 'NED', 'F', '2026-06-25', '19:00', 'Arrowhead Stadium, Kansas City'],
  ['TUR', 'USA', 'D', '2026-06-25', '22:00', 'SoFi Stadium, Los Angeles'],
  ['PAR', 'AUS', 'D', '2026-06-25', '22:00', "Levi's Stadium, San Francisco"],
  ['NOR', 'FRA', 'I', '2026-06-26', '15:00', 'Gillette Stadium, Boston'],
  ['SEN', 'IRQ', 'I', '2026-06-26', '15:00', 'BMO Field, Toronto'],
  ['EGY', 'IRN', 'G', '2026-06-26', '23:00', 'Lumen Field, Seattle'],
  ['NZL', 'BEL', 'G', '2026-06-26', '23:00', 'BC Place, Vancouver'],
  ['CPV', 'KSA', 'H', '2026-06-26', '20:00', 'NRG Stadium, Houston'],
  ['URU', 'ESP', 'H', '2026-06-26', '20:00', 'Estadio Akron, Guadalajara'],
  ['PAN', 'ENG', 'L', '2026-06-27', '17:00', 'MetLife Stadium, New York/New Jersey'],
  ['CRO', 'GHA', 'L', '2026-06-27', '17:00', 'Lincoln Financial Field, Philadelphia'],
  ['ALG', 'AUT', 'J', '2026-06-27', '22:00', 'Arrowhead Stadium, Kansas City'],
  ['JOR', 'ARG', 'J', '2026-06-27', '22:00', 'AT&T Stadium, Dallas'],
  ['COL', 'POR', 'K', '2026-06-27', '19:30', 'Hard Rock Stadium, Miami'],
  ['COD', 'UZB', 'K', '2026-06-27', '19:30', 'Mercedes-Benz Stadium, Atlanta'],
]

function etToUtc(date, time) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-04:00`)
  return d.toISOString().replace('.000Z', '+00')
}

function matchInsert(home, away, group, date, time, venue) {
  const ts = etToUtc(date, time)
  return `INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status)
SELECT h.id, a.id, 'group', timestamptz '${ts}', '${venue.replace(/'/g, "''")}', 'scheduled'
FROM teams h, teams a
WHERE h.code = '${home}' AND a.code = '${away}'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = '${home}' AND at.code = '${away}' AND m.phase = 'group'
  );`
}

const teamValues = teams
  .map(
    (t) =>
      `  ('${t.code}', '${t.name.replace(/'/g, "''")}', 'https://flagcdn.com/w40/${t.flag}.png', '${t.group}')`,
  )
  .join(',\n')

const sql = `-- Seed: Mundial 2026 — Fase de grupos (48 equipos, 72 partidos)
-- Ejecutar en Supabase SQL Editor después de schema.sql
-- Horarios convertidos de ET (EDT, UTC-4) a timestamptz UTC

INSERT INTO teams (code, name, flag_url, group_name)
VALUES
${teamValues}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag_url = EXCLUDED.flag_url,
  group_name = EXCLUDED.group_name;

${matches.map(([h, a, g, d, t, v]) => matchInsert(h, a, g, d, t, v)).join('\n\n')}
`

const out = join(__dirname, '..', 'supabase', 'seed_group_stage.sql')
writeFileSync(out, sql, 'utf8')
console.log(`Generado: ${out}`)
console.log(`Equipos: ${teams.length}, Partidos: ${matches.length}`)
