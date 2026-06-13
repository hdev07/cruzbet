/**
 * Genera supabase/seed_knockout.sql — 32 partidos de eliminatoria (M73–M104)
 * Horarios: hora local de la sede → timestamptz UTC
 */

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cities, localToUtc, venueLabel } from './generate-group-seed.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @typedef {{ type: string, group?: string, pos?: number, groups?: string[], match?: number }} BracketSlot */

/**
 * [match_number, phase, date, local_time, venue, city, home_slot, away_slot, label]
 * @type {Array<[number, string, string, string, string, string, BracketSlot, BracketSlot, string]>}
 */
const knockoutMatches = [
  [73, 'r32', '2026-06-28', '12:00', 'SoFi Stadium', 'Los Angeles',
    { type: 'group_pos', group: 'A', pos: 2 }, { type: 'group_pos', group: 'B', pos: 2 },
    '2º A vs 2º B'],
  [74, 'r32', '2026-06-29', '16:30', 'Gillette Stadium', 'Boston',
    { type: 'group_pos', group: 'E', pos: 1 }, { type: 'best_third', groups: ['A', 'B', 'C', 'D', 'F'] },
    '1º E vs 3º'],
  [75, 'r32', '2026-06-29', '19:00', 'Estadio BBVA', 'Monterrey',
    { type: 'group_pos', group: 'F', pos: 1 }, { type: 'group_pos', group: 'C', pos: 2 },
    '1º F vs 2º C'],
  [76, 'r32', '2026-06-29', '12:00', 'NRG Stadium', 'Houston',
    { type: 'group_pos', group: 'C', pos: 1 }, { type: 'group_pos', group: 'F', pos: 2 },
    '1º C vs 2º F'],
  [77, 'r32', '2026-06-30', '17:00', 'MetLife Stadium', 'New York/New Jersey',
    { type: 'group_pos', group: 'I', pos: 1 }, { type: 'best_third', groups: ['C', 'D', 'F', 'G', 'H'] },
    '1º I vs 3º'],
  [78, 'r32', '2026-06-30', '12:00', 'AT&T Stadium', 'Dallas',
    { type: 'group_pos', group: 'E', pos: 2 }, { type: 'group_pos', group: 'I', pos: 2 },
    '2º E vs 2º I'],
  [79, 'r32', '2026-06-30', '19:00', 'Estadio Azteca', 'Mexico City',
    { type: 'group_pos', group: 'A', pos: 1 }, { type: 'best_third', groups: ['C', 'E', 'F', 'H', 'I'] },
    '1º A vs 3º'],
  [80, 'r32', '2026-07-01', '12:00', 'Mercedes-Benz Stadium', 'Atlanta',
    { type: 'group_pos', group: 'L', pos: 1 }, { type: 'best_third', groups: ['E', 'H', 'I', 'J', 'K'] },
    '1º L vs 3º'],
  [81, 'r32', '2026-07-01', '17:00', "Levi's Stadium", 'San Francisco Bay Area',
    { type: 'group_pos', group: 'D', pos: 1 }, { type: 'best_third', groups: ['B', 'E', 'F', 'I', 'J'] },
    '1º D vs 3º'],
  [82, 'r32', '2026-07-01', '13:00', 'Lumen Field', 'Seattle',
    { type: 'group_pos', group: 'G', pos: 1 }, { type: 'best_third', groups: ['A', 'E', 'H', 'I', 'J'] },
    '1º G vs 3º'],
  [83, 'r32', '2026-07-02', '19:00', 'BMO Field', 'Toronto',
    { type: 'group_pos', group: 'K', pos: 2 }, { type: 'group_pos', group: 'L', pos: 2 },
    '2º K vs 2º L'],
  [84, 'r32', '2026-07-02', '12:00', 'SoFi Stadium', 'Los Angeles',
    { type: 'group_pos', group: 'H', pos: 1 }, { type: 'group_pos', group: 'J', pos: 2 },
    '1º H vs 2º J'],
  [85, 'r32', '2026-07-02', '20:00', 'BC Place', 'Vancouver',
    { type: 'group_pos', group: 'B', pos: 1 }, { type: 'best_third', groups: ['E', 'F', 'G', 'I', 'J'] },
    '1º B vs 3º'],
  [86, 'r32', '2026-07-03', '18:00', 'Hard Rock Stadium', 'Miami',
    { type: 'group_pos', group: 'J', pos: 1 }, { type: 'group_pos', group: 'H', pos: 2 },
    '1º J vs 2º H'],
  [87, 'r32', '2026-07-03', '20:30', 'Arrowhead Stadium', 'Kansas City',
    { type: 'group_pos', group: 'K', pos: 1 }, { type: 'best_third', groups: ['D', 'E', 'I', 'J', 'L'] },
    '1º K vs 3º'],
  [88, 'r32', '2026-07-03', '13:00', 'AT&T Stadium', 'Dallas',
    { type: 'group_pos', group: 'D', pos: 2 }, { type: 'group_pos', group: 'G', pos: 2 },
    '2º D vs 2º G'],
  [89, 'r16', '2026-07-04', '17:00', 'Lincoln Financial Field', 'Philadelphia',
    { type: 'winner', match: 74 }, { type: 'winner', match: 77 },
    'Ganador M74 vs M77'],
  [90, 'r16', '2026-07-04', '12:00', 'NRG Stadium', 'Houston',
    { type: 'winner', match: 73 }, { type: 'winner', match: 75 },
    'Ganador M73 vs M75'],
  [91, 'r16', '2026-07-05', '16:00', 'MetLife Stadium', 'New York/New Jersey',
    { type: 'winner', match: 76 }, { type: 'winner', match: 78 },
    'Ganador M76 vs M78'],
  [92, 'r16', '2026-07-05', '18:00', 'Estadio Azteca', 'Mexico City',
    { type: 'winner', match: 79 }, { type: 'winner', match: 80 },
    'Ganador M79 vs M80'],
  [93, 'r16', '2026-07-06', '14:00', 'AT&T Stadium', 'Dallas',
    { type: 'winner', match: 83 }, { type: 'winner', match: 84 },
    'Ganador M83 vs M84'],
  [94, 'r16', '2026-07-06', '17:00', 'Lumen Field', 'Seattle',
    { type: 'winner', match: 81 }, { type: 'winner', match: 82 },
    'Ganador M81 vs M82'],
  [95, 'r16', '2026-07-07', '12:00', 'Mercedes-Benz Stadium', 'Atlanta',
    { type: 'winner', match: 86 }, { type: 'winner', match: 88 },
    'Ganador M86 vs M88'],
  [96, 'r16', '2026-07-07', '13:00', 'BC Place', 'Vancouver',
    { type: 'winner', match: 85 }, { type: 'winner', match: 87 },
    'Ganador M85 vs M87'],
  [97, 'qf', '2026-07-09', '16:00', 'Gillette Stadium', 'Boston',
    { type: 'winner', match: 89 }, { type: 'winner', match: 90 },
    'Ganador M89 vs M90'],
  [98, 'qf', '2026-07-10', '12:00', 'SoFi Stadium', 'Los Angeles',
    { type: 'winner', match: 93 }, { type: 'winner', match: 94 },
    'Ganador M93 vs M94'],
  [99, 'qf', '2026-07-11', '17:00', 'Hard Rock Stadium', 'Miami',
    { type: 'winner', match: 91 }, { type: 'winner', match: 92 },
    'Ganador M91 vs M92'],
  [100, 'qf', '2026-07-11', '20:00', 'Arrowhead Stadium', 'Kansas City',
    { type: 'winner', match: 95 }, { type: 'winner', match: 96 },
    'Ganador M95 vs M96'],
  [101, 'sf', '2026-07-14', '14:00', 'AT&T Stadium', 'Dallas',
    { type: 'winner', match: 97 }, { type: 'winner', match: 98 },
    'Ganador M97 vs M98'],
  [102, 'sf', '2026-07-15', '15:00', 'Mercedes-Benz Stadium', 'Atlanta',
    { type: 'winner', match: 99 }, { type: 'winner', match: 100 },
    'Ganador M99 vs M100'],
  [103, 'third', '2026-07-18', '17:00', 'Hard Rock Stadium', 'Miami',
    { type: 'loser', match: 101 }, { type: 'loser', match: 102 },
    'Perdedor M101 vs M102'],
  [104, 'final', '2026-07-19', '15:00', 'MetLife Stadium', 'New York/New Jersey',
    { type: 'winner', match: 101 }, { type: 'winner', match: 102 },
    'Ganador M101 vs M102'],
]

function bracketMeta(num, home, away, label) {
  return JSON.stringify({ match_number: num, home, away, label })
}

function matchInsert(num, phase, date, time, venue, cityKey, home, away, label) {
  const ts = localToUtc(date, time, cities[cityKey].tz)
  const venueStr = venueLabel(venue, cityKey).replace(/'/g, "''")
  const meta = bracketMeta(num, home, away, label).replace(/'/g, "''")
  const key = `M${num}`
  return `INSERT INTO matches (home_team_id, away_team_id, phase, match_date, venue, status, bracket_key, bracket_meta)
SELECT NULL, NULL, '${phase}', timestamptz '${ts}', '${venueStr}', 'scheduled', '${key}', '${meta}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE bracket_key = '${key}');`
}

const sql = `-- Seed: Mundial 2026 — Eliminatoria (32 partidos, M73–M104)
-- Ejecutar después de seed_group_stage.sql y knockout_bracket_migration.sql
-- Equipos se asignan automáticamente al terminar fase de grupos / cada ronda

${knockoutMatches.map(([n, ph, d, t, v, c, h, a, lbl]) => matchInsert(n, ph, d, t, v, c, h, a, lbl)).join('\n\n')}
`

const out = join(__dirname, '..', 'supabase', 'seed_knockout.sql')

function writeKnockoutSeed() {
  writeFileSync(out, sql, 'utf8')
  console.log(`Generado: ${out}`)
  console.log(`Partidos eliminatorios: ${knockoutMatches.length}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeKnockoutSeed()
}

export { knockoutMatches }
