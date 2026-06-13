import { createClient } from '@supabase/supabase-js'
import { fetchGoogleSportsSnapshot } from './google-sports.js'
import {
  fetchEspnScoreboard,
  fetchLiveSnapshotForMatch,
  getEspnDateCandidates,
  mergeEspnEvents,
} from './espn-provider.js'
import type { DbMatchRow, LiveMatchSnapshot } from './types.js'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

const MATCH_SELECT = `
  id,
  home_team_id,
  away_team_id,
  status,
  match_date,
  current_minute,
  live_clock_display,
  auto_sync_enabled,
  external_event_id,
  home_team:teams!home_team_id(code, name),
  away_team:teams!away_team_id(code, name)
`

async function resolveSnapshot(
  match: DbMatchRow,
  cachedEvents?: Awaited<ReturnType<typeof fetchEspnScoreboard>>,
): Promise<LiveMatchSnapshot | null> {
  const espn = await fetchLiveSnapshotForMatch(match, cachedEvents)
  if (espn) return espn

  return fetchGoogleSportsSnapshot(match.home_team.name, match.away_team.name)
}

export async function syncAllLiveMatches(): Promise<{
  processed: number
  updated: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const now = Date.now()
  const windowStart = new Date(now - 4 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now + 30 * 60 * 1000).toISOString()

  const { data: matches, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('auto_sync_enabled', true)
    .neq('status', 'finished')
    .gte('match_date', windowStart)
    .lte('match_date', windowEnd)

  if (error) throw new Error(error.message)

  const rows = (matches ?? []) as DbMatchRow[]
  const errors: string[] = []
  let updated = 0

  const scoreboardDates = new Set<string>()
  for (const row of rows) {
    if (!row.match_date) continue
    for (const dateYmd of getEspnDateCandidates(row.match_date)) {
      scoreboardDates.add(dateYmd)
    }
  }

  const scoreboardCache = new Map<string, Awaited<ReturnType<typeof fetchEspnScoreboard>>>()

  for (const dateYmd of scoreboardDates) {
    try {
      scoreboardCache.set(dateYmd, await fetchEspnScoreboard(dateYmd))
    } catch (err) {
      errors.push(`${dateYmd}: ${err instanceof Error ? err.message : 'ESPN error'}`)
    }
  }

  for (const match of rows) {
    try {
      const cached = match.match_date
        ? mergeEspnEvents(
            ...getEspnDateCandidates(match.match_date).map(
              (dateYmd) => scoreboardCache.get(dateYmd) ?? [],
            ),
          )
        : undefined
      const snapshot = await resolveSnapshot(match, cached)

      if (!snapshot) continue

      const { data: result, error: rpcError } = await supabase.rpc('apply_live_sync', {
        p_match_id: match.id,
        p_status: snapshot.status,
        p_current_minute: snapshot.current_minute,
        p_home_score: snapshot.home_score,
        p_away_score: snapshot.away_score,
        p_goals: snapshot.goals,
        p_external_event_id: snapshot.external_event_id,
        p_live_clock_display: snapshot.live_clock_display,
      })

      if (rpcError) {
        errors.push(`${match.id}: ${rpcError.message}`)
        continue
      }

      if (result && typeof result === 'object' && (result as { ok?: boolean }).ok) {
        updated += 1
      }
    } catch (err) {
      errors.push(`${match.id}: ${err instanceof Error ? err.message : 'sync error'}`)
    }
  }

  return { processed: rows.length, updated, errors }
}

function isStaticSyncToken(token: string): boolean {
  const liveToken = process.env.LIVE_SYNC_TOKEN
  if (liveToken && token === liveToken) return true

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && token === cronSecret) return true

  return false
}

async function isAdminAccessToken(token: string): Promise<boolean> {
  if (!token.includes('.')) return false

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return false

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
    const userEmail = data.user.email?.toLowerCase()

    return (
      data.user.app_metadata?.role === 'admin' ||
      (!!adminEmail && userEmail === adminEmail)
    )
  } catch {
    return false
  }
}

export async function isAuthorizedSyncRequest(
  authHeader: string | undefined,
): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)

  if (isStaticSyncToken(token)) return true
  return isAdminAccessToken(token)
}
