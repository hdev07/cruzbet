import { BASE_QUINIELA_MIN_ACTIVE_ROUND } from '@/constants/base-quiniela-rules'
import type { BaseQuinielaRound } from '@/types'

export function hasRoundStarted(
  firstKickoffMs: number | null | undefined,
  now = Date.now(),
): boolean {
  if (firstKickoffMs == null) return false
  return now >= firstKickoffMs
}

/**
 * Jornada activa: la última cuya jornada siguiente aún no ha empezado.
 * Ej. Jornada 1 hasta el kickoff del primer partido de Jornada 2.
 */
export function resolveActiveBaseRound(
  rounds: BaseQuinielaRound[],
  firstKickoffByRoundId: Record<string, number | null>,
  now = Date.now(),
): BaseQuinielaRound | null {
  if (!rounds.length) return null

  const sorted = [...rounds].sort((a, b) => a.round_number - b.round_number)
  let active = sorted[0]!

  for (let i = 1; i < sorted.length; i++) {
    const round = sorted[i]!
    if (hasRoundStarted(firstKickoffByRoundId[round.id], now)) {
      active = round
    } else {
      break
    }
  }

  if (BASE_QUINIELA_MIN_ACTIVE_ROUND > 1) {
    const floor = sorted.find((r) => r.round_number >= BASE_QUINIELA_MIN_ACTIVE_ROUND)
    if (floor && active.round_number < floor.round_number) {
      active = floor
    }
  }

  return active
}

export function firstKickoffFromRoundMatches(
  matches: { match?: { match_date: string | null } | null }[],
): number | null {
  let min: number | null = null

  for (const row of matches) {
    const date = row.match?.match_date
    if (!date) continue
    const ms = new Date(date).getTime()
    if (min == null || ms < min) min = ms
  }

  return min
}

export function buildFirstKickoffByRoundId(
  rows: { round_id: string; match: { match_date: string | null } | null }[],
): Record<string, number | null> {
  const map: Record<string, number | null> = {}

  for (const row of rows) {
    const date = row.match?.match_date
    if (!date) continue
    const ms = new Date(date).getTime()
    const prev = map[row.round_id]
    if (prev == null || ms < prev) {
      map[row.round_id] = ms
    }
  }

  return map
}
