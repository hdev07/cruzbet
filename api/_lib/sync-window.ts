export const LIVE_LOOKBACK_MS = 12 * 60 * 60 * 1000
export const LIVE_LOOKAHEAD_MS = 2 * 60 * 60 * 1000
export const CATCHUP_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000
export const MAX_BACKFILL_DAYS = 21

export class SyncRequestError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'SyncRequestError'
    this.status = status
  }
}

export type SyncWindow =
  | { mode: 'single'; matchId: string }
  | { mode: 'range'; fromIso: string; toIso: string }
  | {
      mode: 'live-and-catchup'
      liveFromIso: string
      liveToIso: string
      catchupFromIso: string
      catchupToIso: string
    }

export interface SyncWindowOptions {
  matchId?: string
  from?: string
  to?: string
  days?: number
}

function parseDateBound(value: string, endOfDay: boolean): string | null {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const offset = endOfDay ? 'T23:59:59.999-06:00' : 'T00:00:00.000-06:00'
    const timestamp = Date.parse(`${trimmed}${offset}`)
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
  }

  const timestamp = Date.parse(trimmed)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

export function resolveSyncWindow(
  now: Date,
  options: SyncWindowOptions = {},
): SyncWindow {
  const matchId = options.matchId?.trim()
  if (matchId) return { mode: 'single', matchId }

  if (options.days != null) {
    if (
      !Number.isInteger(options.days) ||
      options.days < 1 ||
      options.days > MAX_BACKFILL_DAYS
    ) {
      throw new SyncRequestError('invalid_days')
    }

    return {
      mode: 'range',
      fromIso: new Date(now.getTime() - options.days * 86_400_000).toISOString(),
      toIso: new Date(now.getTime() + LIVE_LOOKAHEAD_MS).toISOString(),
    }
  }

  if (options.from || options.to) {
    const fromIso = options.from
      ? parseDateBound(options.from, false)
      : new Date(now.getTime() - CATCHUP_LOOKBACK_MS).toISOString()
    const toIso = options.to
      ? parseDateBound(options.to, true)
      : new Date(now.getTime() + LIVE_LOOKAHEAD_MS).toISOString()

    if (!fromIso || !toIso || fromIso > toIso) {
      throw new SyncRequestError('invalid_date_range')
    }

    return { mode: 'range', fromIso, toIso }
  }

  const liveFrom = new Date(now.getTime() - LIVE_LOOKBACK_MS)
  return {
    mode: 'live-and-catchup',
    liveFromIso: liveFrom.toISOString(),
    liveToIso: new Date(now.getTime() + LIVE_LOOKAHEAD_MS).toISOString(),
    catchupFromIso: new Date(now.getTime() - CATCHUP_LOOKBACK_MS).toISOString(),
    catchupToIso: liveFrom.toISOString(),
  }
}
