import { createClient } from '@supabase/supabase-js'
import {
  fetchEspnScoreboard,
  fetchEspnSnapshotForMatch,
  getEspnDateCandidates,
  mergeEspnEvents,
} from './espn-provider.js'
import type { DbMatchRow, SyncResult } from './types.js'

const ACTIVE_COMPETITION_SLUG =
  process.env.ACTIVE_COMPETITION_SLUG ?? 'liga-mx-apertura-2026'

const MATCH_SELECT = `
  id,
  status,
  match_date,
  current_minute,
  live_clock_display,
  auto_sync_enabled,
  external_event_id,
  home_team:teams!home_team_id(code, name),
  away_team:teams!away_team_id(code, name)
`

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function normalizeMatchRow(row: unknown): DbMatchRow {
  const candidate = row as DbMatchRow & {
    home_team: DbMatchRow['home_team'] | DbMatchRow['home_team'][]
    away_team: DbMatchRow['away_team'] | DbMatchRow['away_team'][]
  }

  return {
    ...candidate,
    home_team: Array.isArray(candidate.home_team)
      ? candidate.home_team[0]!
      : candidate.home_team,
    away_team: Array.isArray(candidate.away_team)
      ? candidate.away_team[0]!
      : candidate.away_team,
  }
}

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      await worker(values[index]!)
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, values.length) },
      runWorker,
    ),
  )
}

export async function syncEspnMatches(options?: {
  matchId?: string
}): Promise<SyncResult> {
  const supabase = getSupabaseAdmin()

  const { data: competition, error: competitionError } = await supabase
    .from('competitions')
    .select('id')
    .eq('slug', ACTIVE_COMPETITION_SLUG)
    .eq('is_active', true)
    .single()

  if (competitionError || !competition) {
    throw new Error(
      competitionError?.message ??
        `No existe la competencia activa ${ACTIVE_COMPETITION_SLUG}`,
    )
  }

  let matchQuery = supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('competition_id', competition.id)
    .eq('auto_sync_enabled', true)

  if (options?.matchId) {
    matchQuery = matchQuery.eq('id', options.matchId)
  } else {
    const now = Date.now()
    matchQuery = matchQuery
      .gte('match_date', new Date(now - 12 * 60 * 60 * 1000).toISOString())
      .lte('match_date', new Date(now + 2 * 60 * 60 * 1000).toISOString())
  }

  const { data, error } = await matchQuery.order('match_date')
  if (error) throw new Error(error.message)

  const matches = (data ?? []).map(normalizeMatchRow)
  const result: SyncResult = {
    processed: matches.length,
    matched: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  const scoreboardDates = new Set<string>()
  for (const match of matches) {
    if (match.external_event_id || !match.match_date) continue
    for (const date of getEspnDateCandidates(match.match_date)) {
      scoreboardDates.add(date)
    }
  }

  const scoreboardLists = await Promise.all(
    [...scoreboardDates].map(async (date) => {
      try {
        return await fetchEspnScoreboard(date)
      } catch (error) {
        result.errors.push(
          `${date}: ${error instanceof Error ? error.message : 'ESPN error'}`,
        )
        return []
      }
    }),
  )
  const scoreboard = mergeEspnEvents(...scoreboardLists)

  await mapWithConcurrency(matches, 3, async (match) => {
    try {
      const snapshot = await fetchEspnSnapshotForMatch(match, scoreboard)
      if (!snapshot) {
        result.skipped += 1
        const kickoff = match.match_date ? Date.parse(match.match_date) : NaN
        if (
          match.status === 'live' ||
          (Number.isFinite(kickoff) &&
            kickoff <= Date.now() + 30 * 60 * 1000)
        ) {
          result.errors.push(`${match.id}: espn_event_not_found`)
        }
        return
      }

      result.matched += 1
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'apply_espn_snapshot',
        {
          p_match_id: match.id,
          p_snapshot: snapshot,
        },
      )

      if (rpcError) {
        result.errors.push(`${match.id}: ${rpcError.message}`)
        return
      }

      const applied = rpcResult as {
        ok?: boolean
        skipped?: string
        error?: string
      } | null

      if (!applied?.ok) {
        result.errors.push(
          `${match.id}: ${applied?.error ?? 'snapshot_not_applied'}`,
        )
        return
      }

      if (applied.skipped) {
        result.skipped += 1
      } else {
        result.updated += 1
      }
    } catch (error) {
      result.errors.push(
        `${match.id}: ${error instanceof Error ? error.message : 'sync_error'}`,
      )
    }
  })

  return result
}

function staticTokenMatches(token: string): boolean {
  return [process.env.LIVE_SYNC_TOKEN, process.env.CRON_SECRET]
    .filter((value): value is string => Boolean(value))
    .some((value) => value === token)
}

async function tokenBelongsToAdmin(token: string): Promise<boolean> {
  if (!token.includes('.')) return false

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return false

  const expectedAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  return (
    data.user.app_metadata?.role === 'admin' ||
    Boolean(
      expectedAdminEmail &&
        data.user.email?.toLowerCase() === expectedAdminEmail,
    )
  )
}

export async function isAuthorizedSyncRequest(
  authorization: string | undefined,
): Promise<boolean> {
  if (!authorization?.startsWith('Bearer ')) return false
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return false
  return staticTokenMatches(token) || tokenBelongsToAdmin(token)
}
