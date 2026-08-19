import { supabase } from '@/lib/supabase'
import type { Match } from '@/types'

const SYNC_INTERVAL_MS = 60_000
const WINDOW_BEFORE_MS = 4 * 60 * 60 * 1000
const WINDOW_AFTER_MS = 30 * 60 * 1000

export function isMatchInSyncWindow(match: Match, now = Date.now()): boolean {
  if (match.auto_sync_enabled === false) return false
  if (match.status === 'finished') return false
  if (!match.match_date) return false

  const kickoff = new Date(match.match_date).getTime()
  return kickoff >= now - WINDOW_BEFORE_MS && kickoff <= now + WINDOW_AFTER_MS
}

export function hasMatchesInSyncWindow(matches: Match[], now = Date.now()): boolean {
  return matches.some((m) => isMatchInSyncWindow(m, now))
}

export type LiveSyncOptions = {
  matchId?: string
  from?: string
  to?: string
  days?: number
}

export type LiveSyncResponse = {
  ok: boolean
  error?: string
  processed?: number
  matched?: number
  updated?: number
  skipped?: number
  errors?: string[]
  scoreboard_dates?: string[]
  scoreboard_events?: number
}

function getSyncUrl(options?: LiveSyncOptions): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') ?? ''
  const base = origin ? `${origin}/api/sync-live` : '/api/sync-live'
  const params = new URLSearchParams()
  if (options?.matchId) params.set('matchId', options.matchId)
  if (options?.from) params.set('from', options.from)
  if (options?.to) params.set('to', options.to)
  if (options?.days != null) params.set('days', String(options.days))
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

export async function triggerLiveSync(
  options?: LiveSyncOptions,
): Promise<LiveSyncResponse> {
  const { data } = await supabase.auth.getSession()
  const bearer = data.session?.access_token ?? import.meta.env.VITE_LIVE_SYNC_TOKEN
  if (!bearer) {
    return { ok: false, error: 'Inicia sesión como admin o configura VITE_LIVE_SYNC_TOKEN' }
  }

  try {
    const res = await fetch(getSyncUrl(options), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
    })
    const body = (await res.json().catch(() => ({}))) as LiveSyncResponse & {
      error?: string
    }
    if (!res.ok) {
      return { ...body, ok: false, error: body.error ?? `HTTP ${res.status}` }
    }
    if (body.errors?.length) {
      return {
        ...body,
        ok: false,
        error: `${body.updated ?? 0} actualizados, ${body.errors.length} con error`,
      }
    }
    return { ...body, ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error de red' }
  }
}

export { SYNC_INTERVAL_MS }
