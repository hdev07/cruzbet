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

function getSyncUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/sync-live`
  }
  const site = import.meta.env.VITE_SITE_URL
  return site ? `${site.replace(/\/$/, '')}/api/sync-live` : '/api/sync-live'
}

export async function triggerLiveSync(): Promise<{ ok: boolean; error?: string }> {
  const token = import.meta.env.VITE_LIVE_SYNC_TOKEN
  if (!token) {
    return { ok: false, error: 'Falta VITE_LIVE_SYNC_TOKEN' }
  }

  try {
    const res = await fetch(getSyncUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: body.error ?? `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error de red' }
  }
}

export { SYNC_INTERVAL_MS }
