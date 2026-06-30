/**
 * Sincroniza penales de ESPN en partidos de eliminatoria ya finalizados sin tanda guardada.
 * Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-knockout-penalties.mjs
 */
import { createClient } from '@supabase/supabase-js'
import {
  fetchEspnScoreboard,
  fetchLiveSnapshotForMatch,
  getEspnDateCandidates,
  mergeEspnEvents,
} from '../api/lib/espn-provider.js'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const MATCH_SELECT = `
  id,
  bracket_key,
  home_team_id,
  away_team_id,
  status,
  phase,
  match_date,
  home_score,
  away_score,
  penalty_home_score,
  penalty_away_score,
  external_event_id,
  home_team:teams!home_team_id(code, name),
  away_team:teams!away_team_id(code, name)
`

const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

const { data: matches, error } = await supabase
  .from('matches')
  .select(MATCH_SELECT)
  .eq('status', 'finished')
  .in('phase', ['r32', 'r16', 'qf', 'sf'])
  .is('penalty_home_score', null)
  .gte('match_date', since)

if (error) {
  console.error(error.message)
  process.exit(1)
}

const rows = matches ?? []
console.log(`Partidos sin penales: ${rows.length}`)

const scoreboardCache = new Map()
for (const row of rows) {
  if (!row.match_date) continue
  for (const dateYmd of getEspnDateCandidates(row.match_date)) {
    if (!scoreboardCache.has(dateYmd)) {
      scoreboardCache.set(dateYmd, await fetchEspnScoreboard(dateYmd))
    }
  }
}

let updated = 0
for (const match of rows) {
  const cached = match.match_date
    ? mergeEspnEvents(
        ...getEspnDateCandidates(match.match_date).map((d) => scoreboardCache.get(d) ?? []),
      )
    : undefined

  const snapshot = await fetchLiveSnapshotForMatch(match, cached)
  if (snapshot?.penalty_home_score == null || snapshot?.penalty_away_score == null) {
    console.log(`  ${match.bracket_key ?? match.id}: sin penales en ESPN`)
    continue
  }

  const { error: rpcError } = await supabase.rpc('apply_live_sync', {
    p_match_id: match.id,
    p_status: 'finished',
    p_current_minute: snapshot.current_minute,
    p_home_score: snapshot.home_score,
    p_away_score: snapshot.away_score,
    p_goals: [],
    p_cards: [],
    p_external_event_id: snapshot.external_event_id,
    p_live_clock_display: snapshot.live_clock_display,
    p_live_status_detail: snapshot.live_status_detail,
    p_penalty_home_score: snapshot.penalty_home_score,
    p_penalty_away_score: snapshot.penalty_away_score,
  })

  if (rpcError) {
    console.error(`  ${match.bracket_key}: ${rpcError.message}`)
    continue
  }

  console.log(
    `  ${match.bracket_key}: Pen. ${snapshot.penalty_home_score}-${snapshot.penalty_away_score}`,
  )
  updated += 1
}

if (updated > 0) {
  const { error: refreshError } = await supabase.rpc('refresh_knockout_bracket')
  if (refreshError) {
    console.warn('refresh_knockout_bracket:', refreshError.message)
  } else {
    console.log('Cuadro actualizado (refresh_knockout_bracket)')
  }
}

console.log(`Actualizados: ${updated}/${rows.length}`)
