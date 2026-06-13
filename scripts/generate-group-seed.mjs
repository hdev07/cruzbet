/**
 * Genera supabase/seed_group_stage.sql con los 72 partidos de fase de grupos
 * Fuente: calendario oficial FIFA World Cup 2026 (grupos A–L)
 * Horarios: hora local de la sede → timestamptz UTC
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

/** @type {Record<string, { tz: string, label: string }>} */
const cities = {
  'Mexico City': { tz: 'America/Mexico_City', label: 'Ciudad de México' },
  Guadalajara: { tz: 'America/Mexico_City', label: 'Guadalajara' },
  Toronto: { tz: 'America/Toronto', label: 'Toronto' },
  'Los Angeles': { tz: 'America/Los_Angeles', label: 'Los Angeles' },
  Boston: { tz: 'America/New_York', label: 'Boston' },
  Vancouver: { tz: 'America/Vancouver', label: 'Vancouver' },
  'New York/New Jersey': { tz: 'America/New_York', label: 'New York/New Jersey' },
  'San Francisco Bay Area': { tz: 'America/Los_Angeles', label: 'San Francisco Bay Area' },
  Philadelphia: { tz: 'America/New_York', label: 'Philadelphia' },
  Houston: { tz: 'America/Chicago', label: 'Houston' },
  Dallas: { tz: 'America/Chicago', label: 'Dallas' },
  Monterrey: { tz: 'America/Monterrey', label: 'Monterrey' },
  Miami: { tz: 'America/New_York', label: 'Miami' },
  Atlanta: { tz: 'America/New_York', label: 'Atlanta' },
  Seattle: { tz: 'America/Los_Angeles', label: 'Seattle' },
  'Kansas City': { tz: 'America/Chicago', label: 'Kansas City' },
}

// [home, away, group, date, time local, venue, city key]
const matches = [
  ['MEX', 'RSA', 'A', '2026-06-11', '13:00', 'Estadio Azteca', 'Mexico City'],
  ['KOR', 'CZE', 'A', '2026-06-11', '20:00', 'Estadio Akron', 'Guadalajara'],
  ['CAN', 'BIH', 'B', '2026-06-12', '15:00', 'BMO Field', 'Toronto'],
  ['USA', 'PAR', 'D', '2026-06-12', '18:00', 'SoFi Stadium', 'Los Angeles'],
  ['HAI', 'SCO', 'C', '2026-06-13', '21:00', 'Gillette Stadium', 'Boston'],
  ['AUS', 'TUR', 'D', '2026-06-13', '21:00', 'BC Place', 'Vancouver'],
  ['BRA', 'MAR', 'C', '2026-06-13', '18:00', 'MetLife Stadium', 'New York/New Jersey'],
  ['QAT', 'SUI', 'B', '2026-06-13', '12:00', "Levi's Stadium", 'San Francisco Bay Area'],
  ['CIV', 'ECU', 'E', '2026-06-14', '19:00', 'Lincoln Financial Field', 'Philadelphia'],
  ['GER', 'CUW', 'E', '2026-06-14', '12:00', 'NRG Stadium', 'Houston'],
  ['NED', 'JPN', 'F', '2026-06-14', '15:00', 'AT&T Stadium', 'Dallas'],
  ['SWE', 'TUN', 'F', '2026-06-14', '20:00', 'Estadio BBVA', 'Monterrey'],
  ['KSA', 'URU', 'H', '2026-06-15', '18:00', 'Hard Rock Stadium', 'Miami'],
  ['ESP', 'CPV', 'H', '2026-06-15', '12:00', 'Mercedes-Benz Stadium', 'Atlanta'],
  ['IRN', 'NZL', 'G', '2026-06-15', '18:00', 'SoFi Stadium', 'Los Angeles'],
  ['BEL', 'EGY', 'G', '2026-06-15', '12:00', 'Lumen Field', 'Seattle'],
  ['FRA', 'SEN', 'I', '2026-06-16', '15:00', 'MetLife Stadium', 'New York/New Jersey'],
  ['IRQ', 'NOR', 'I', '2026-06-16', '18:00', 'Gillette Stadium', 'Boston'],
  ['ARG', 'ALG', 'J', '2026-06-16', '20:00', 'Arrowhead Stadium', 'Kansas City'],
  ['AUT', 'JOR', 'J', '2026-06-16', '21:00', "Levi's Stadium", 'San Francisco Bay Area'],
  ['GHA', 'PAN', 'L', '2026-06-17', '19:00', 'BMO Field', 'Toronto'],
  ['ENG', 'CRO', 'L', '2026-06-17', '15:00', 'AT&T Stadium', 'Dallas'],
  ['POR', 'COD', 'K', '2026-06-17', '12:00', 'NRG Stadium', 'Houston'],
  ['UZB', 'COL', 'K', '2026-06-17', '20:00', 'Estadio Azteca', 'Mexico City'],
  ['CZE', 'RSA', 'A', '2026-06-18', '12:00', 'Mercedes-Benz Stadium', 'Atlanta'],
  ['SUI', 'BIH', 'B', '2026-06-18', '12:00', 'SoFi Stadium', 'Los Angeles'],
  ['CAN', 'QAT', 'B', '2026-06-18', '15:00', 'BC Place', 'Vancouver'],
  ['MEX', 'KOR', 'A', '2026-06-18', '19:00', 'Estadio Akron', 'Guadalajara'],
  ['BRA', 'HAI', 'C', '2026-06-19', '21:00', 'Lincoln Financial Field', 'Philadelphia'],
  ['SCO', 'MAR', 'C', '2026-06-19', '18:00', 'Gillette Stadium', 'Boston'],
  ['TUR', 'PAR', 'D', '2026-06-19', '20:00', "Levi's Stadium", 'San Francisco Bay Area'],
  ['USA', 'AUS', 'D', '2026-06-19', '12:00', 'Lumen Field', 'Seattle'],
  ['GER', 'CIV', 'E', '2026-06-20', '16:00', 'BMO Field', 'Toronto'],
  ['ECU', 'CUW', 'E', '2026-06-20', '19:00', 'Arrowhead Stadium', 'Kansas City'],
  ['NED', 'SWE', 'F', '2026-06-20', '12:00', 'NRG Stadium', 'Houston'],
  ['TUN', 'JPN', 'F', '2026-06-20', '22:00', 'Estadio BBVA', 'Monterrey'],
  ['URU', 'CPV', 'H', '2026-06-21', '18:00', 'Hard Rock Stadium', 'Miami'],
  ['ESP', 'KSA', 'H', '2026-06-21', '12:00', 'Mercedes-Benz Stadium', 'Atlanta'],
  ['BEL', 'IRN', 'G', '2026-06-21', '12:00', 'SoFi Stadium', 'Los Angeles'],
  ['NZL', 'EGY', 'G', '2026-06-21', '18:00', 'BC Place', 'Vancouver'],
  ['NOR', 'SEN', 'I', '2026-06-22', '20:00', 'MetLife Stadium', 'New York/New Jersey'],
  ['FRA', 'IRQ', 'I', '2026-06-22', '17:00', 'Lincoln Financial Field', 'Philadelphia'],
  ['ARG', 'AUT', 'J', '2026-06-22', '12:00', 'AT&T Stadium', 'Dallas'],
  ['JOR', 'ALG', 'J', '2026-06-22', '20:00', "Levi's Stadium", 'San Francisco Bay Area'],
  ['ENG', 'GHA', 'L', '2026-06-23', '16:00', 'Gillette Stadium', 'Boston'],
  ['PAN', 'CRO', 'L', '2026-06-23', '19:00', 'BMO Field', 'Toronto'],
  ['POR', 'UZB', 'K', '2026-06-23', '12:00', 'NRG Stadium', 'Houston'],
  ['COL', 'COD', 'K', '2026-06-23', '20:00', 'Estadio Akron', 'Guadalajara'],
  ['SCO', 'BRA', 'C', '2026-06-24', '18:00', 'Hard Rock Stadium', 'Miami'],
  ['MAR', 'HAI', 'C', '2026-06-24', '18:00', 'Mercedes-Benz Stadium', 'Atlanta'],
  ['SUI', 'CAN', 'B', '2026-06-24', '12:00', 'BC Place', 'Vancouver'],
  ['BIH', 'QAT', 'B', '2026-06-24', '12:00', 'Lumen Field', 'Seattle'],
  ['CZE', 'MEX', 'A', '2026-06-24', '19:00', 'Estadio Azteca', 'Mexico City'],
  ['RSA', 'KOR', 'A', '2026-06-24', '19:00', 'Estadio BBVA', 'Monterrey'],
  ['CUW', 'CIV', 'E', '2026-06-25', '16:00', 'Lincoln Financial Field', 'Philadelphia'],
  ['ECU', 'GER', 'E', '2026-06-25', '16:00', 'MetLife Stadium', 'New York/New Jersey'],
  ['JPN', 'SWE', 'F', '2026-06-25', '18:00', 'AT&T Stadium', 'Dallas'],
  ['TUN', 'NED', 'F', '2026-06-25', '18:00', 'Arrowhead Stadium', 'Kansas City'],
  ['TUR', 'USA', 'D', '2026-06-25', '19:00', 'SoFi Stadium', 'Los Angeles'],
  ['PAR', 'AUS', 'D', '2026-06-25', '19:00', "Levi's Stadium", 'San Francisco Bay Area'],
  ['NOR', 'FRA', 'I', '2026-06-26', '15:00', 'Gillette Stadium', 'Boston'],
  ['SEN', 'IRQ', 'I', '2026-06-26', '15:00', 'BMO Field', 'Toronto'],
  ['EGY', 'IRN', 'G', '2026-06-26', '20:00', 'Lumen Field', 'Seattle'],
  ['NZL', 'BEL', 'G', '2026-06-26', '20:00', 'BC Place', 'Vancouver'],
  ['CPV', 'KSA', 'H', '2026-06-26', '19:00', 'NRG Stadium', 'Houston'],
  ['URU', 'ESP', 'H', '2026-06-26', '18:00', 'Estadio Akron', 'Guadalajara'],
  ['PAN', 'ENG', 'L', '2026-06-27', '17:00', 'MetLife Stadium', 'New York/New Jersey'],
  ['CRO', 'GHA', 'L', '2026-06-27', '17:00', 'Lincoln Financial Field', 'Philadelphia'],
  ['ALG', 'AUT', 'J', '2026-06-27', '21:00', 'Arrowhead Stadium', 'Kansas City'],
  ['JOR', 'ARG', 'J', '2026-06-27', '21:00', 'AT&T Stadium', 'Dallas'],
  ['COL', 'POR', 'K', '2026-06-27', '19:30', 'Hard Rock Stadium', 'Miami'],
  ['COD', 'UZB', 'K', '2026-06-27', '19:30', 'Mercedes-Benz Stadium', 'Atlanta'],
]

function localToUtc(date, time, timezone) {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  let utcMs = Date.UTC(y, mo - 1, d, h, mi)

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  for (let attempt = 0; attempt < 5; attempt++) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]))
    const localH = Number(parts.hour === '24' ? '0' : parts.hour)
    const localM = Number(parts.minute)
    const localD = Number(parts.day)
    const localMo = Number(parts.month)
    const localY = Number(parts.year)

    const targetMs = Date.UTC(y, mo - 1, d, h, mi)
    const actualMs = Date.UTC(localY, localMo - 1, localD, localH, localM)
    const diff = targetMs - actualMs
    utcMs += diff
    if (diff === 0) break
  }

  return new Date(utcMs).toISOString().replace('.000Z', '+00')
}

function venueLabel(venue, cityKey) {
  const city = cities[cityKey]
  if (!city) throw new Error(`Ciudad desconocida: ${cityKey}`)
  return `${venue}, ${city.label}`
}

function matchInsert(home, away, date, time, venue, cityKey, matchNumber) {
  const ts = localToUtc(date, time, cities[cityKey].tz)
  const venueStr = venueLabel(venue, cityKey).replace(/'/g, "''")
  const bracketKey = `M${matchNumber}`
  const bracketMeta = JSON.stringify({ match_number: matchNumber }).replace(/'/g, "''")
  return `INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT h.id, a.id, 'group', timestamptz '${ts}', '${venueStr}', 'scheduled', '${bracketKey}', '${bracketMeta}'::jsonb
FROM teams h, teams a
WHERE h.code = '${home}' AND a.code = '${away}'
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.code = '${home}' AND at.code = '${away}' AND m.phase = 'group'
  );`
}

function matchUpdate(home, away, date, time, venue, cityKey, matchNumber) {
  const ts = localToUtc(date, time, cities[cityKey].tz)
  const venueStr = venueLabel(venue, cityKey).replace(/'/g, "''")
  const bracketKey = `M${matchNumber}`
  const bracketMeta = JSON.stringify({ match_number: matchNumber }).replace(/'/g, "''")
  return `UPDATE matches m
SET match_date = timestamptz '${ts}',
    venue = '${venueStr}',
    bracket_key = '${bracketKey}',
    bracket_meta = '${bracketMeta}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = '${home}'
  AND a.code = '${away}'
  AND m.phase = 'group';`
}

const teamValues = teams
  .map(
    (t) =>
      `  ('${t.code}', '${t.name.replace(/'/g, "''")}', 'https://flagcdn.com/w40/${t.flag}.png', '${t.group}')`,
  )
  .join(',\n')

const seedSql = `-- Seed: Mundial 2026 — Fase de grupos (48 equipos, 72 partidos)
-- Ejecutar en Supabase SQL Editor después de schema.sql
-- Horarios: hora local de la sede → timestamptz UTC

INSERT INTO teams (code, name, flag_url, group_name)
VALUES
${teamValues}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag_url = EXCLUDED.flag_url,
  group_name = EXCLUDED.group_name;

${matches.map(([h, a, _g, d, t, v, c], i) => matchInsert(h, a, d, t, v, c, i + 1)).join('\n\n')}
`

const updateSql = `-- Actualizar horarios (hora local) y sedes de fase de grupos
-- Ejecutar en SQL Editor de Supabase si ya tienes los partidos cargados

${matches.map(([h, a, _g, d, t, v, c], i) => matchUpdate(h, a, d, t, v, c, i + 1)).join('\n\n')}
`

const root = join(__dirname, '..', 'supabase')

function writeSeedFiles() {
  writeFileSync(join(root, 'seed_group_stage.sql'), seedSql, 'utf8')
  writeFileSync(join(root, 'update_group_stage_local_times_migration.sql'), updateSql, 'utf8')
  console.log(`Generado: ${join(root, 'seed_group_stage.sql')}`)
  console.log(`Generado: ${join(root, 'update_group_stage_local_times_migration.sql')}`)
  console.log(`Equipos: ${teams.length}, Partidos: ${matches.length}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeSeedFiles()
}

export { matches, cities, localToUtc, venueLabel, teams }
