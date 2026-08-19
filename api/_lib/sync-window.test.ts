import { describe, expect, it } from 'vitest'
import {
  CATCHUP_LOOKBACK_MS,
  LIVE_LOOKAHEAD_MS,
  LIVE_LOOKBACK_MS,
  resolveSyncWindow,
  SyncRequestError,
} from './sync-window.js'

describe('resolveSyncWindow', () => {
  const now = new Date('2026-08-19T06:13:00.000Z')

  it('prioriza un partido concreto', () => {
    expect(
      resolveSyncWindow(now, {
        matchId: 'abc',
        days: 8,
        from: '2026-08-15',
      }),
    ).toEqual({ mode: 'single', matchId: 'abc' })
  })

  it('recupera N días atrás para un backfill de jornada', () => {
    expect(resolveSyncWindow(now, { days: 8 })).toEqual({
      mode: 'range',
      fromIso: new Date(now.getTime() - 8 * 86_400_000).toISOString(),
      toIso: new Date(now.getTime() + LIVE_LOOKAHEAD_MS).toISOString(),
    })
  })

  it('interpreta YYYY-MM-DD en horario de Ciudad de México', () => {
    expect(
      resolveSyncWindow(now, { from: '2026-08-15', to: '2026-08-17' }),
    ).toEqual({
      mode: 'range',
      fromIso: '2026-08-15T06:00:00.000Z',
      toIso: '2026-08-18T05:59:59.999Z',
    })
  })

  it('incluye catch-up de 14 días cuando cron-job.org llama sin fechas', () => {
    const liveFrom = new Date(now.getTime() - LIVE_LOOKBACK_MS)
    expect(resolveSyncWindow(now)).toEqual({
      mode: 'live-and-catchup',
      liveFromIso: liveFrom.toISOString(),
      liveToIso: new Date(now.getTime() + LIVE_LOOKAHEAD_MS).toISOString(),
      catchupFromIso: new Date(
        now.getTime() - CATCHUP_LOOKBACK_MS,
      ).toISOString(),
      catchupToIso: liveFrom.toISOString(),
    })
  })

  it('rechaza un rango de días inválido', () => {
    expect(() => resolveSyncWindow(now, { days: 0 })).toThrow(SyncRequestError)
    expect(() => resolveSyncWindow(now, { days: 30 })).toThrow(SyncRequestError)
  })
})
