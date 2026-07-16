import type { Match, MatchStatus } from '@/types'

/** Duración estimada: 45' + 15' descanso + 45' + 10' de agregado */
export const MATCH_TOTAL_DURATION_MIN = 45 + 15 + 45 + 10

/** Tiempo que un partido finalizado permanece destacado */
export const RECENTLY_FINISHED_GRACE_MS = 2 * 60 * 60 * 1000

export function getKickoffTime(match: Pick<Match, 'match_date'>): number | null {
  if (!match.match_date) return null
  return new Date(match.match_date).getTime()
}

export function getEffectiveMatchStatus(match: Match): MatchStatus {
  if (match.status === 'finished') return 'finished'
  if (match.status === 'live') return 'live'
  return 'scheduled'
}

export function isEffectivelyLive(match: Match): boolean {
  return getEffectiveMatchStatus(match) === 'live'
}

export function getEstimatedMatchEndTime(match: Pick<Match, 'match_date'>): number | null {
  const kickoff = getKickoffTime(match)
  if (kickoff === null) return null
  return kickoff + MATCH_TOTAL_DURATION_MIN * 60_000
}

export function isRecentlyFinished(match: Match, now = Date.now()): boolean {
  if (match.status !== 'finished') return false
  const end = getEstimatedMatchEndTime(match)
  if (end === null) return true
  return now < end + RECENTLY_FINISHED_GRACE_MS
}

export function matchSortTime(match: Pick<Match, 'match_date' | 'created_at'>): number {
  const date = match.match_date ?? match.created_at
  return date ? new Date(date).getTime() : 0
}

/** Máximo de partidos estelares cuando comparten la misma hora de inicio. */
export const MAX_SPOTLIGHT_MATCHES = 3

/** Partidos que comparten exactamente la misma hora de kickoff (hasta `max`). */
export function matchesAtSameKickoff(
  matches: Match[],
  kickoffMs: number,
  max = MAX_SPOTLIGHT_MATCHES,
): Match[] {
  return matches
    .filter((m) => getKickoffTime(m) === kickoffMs)
    .sort((a, b) => matchSortTime(a) - matchSortTime(b) || a.id.localeCompare(b.id))
    .slice(0, max)
}

/**
 * Prioridad: en vivo → recién finalizado → próximo programado.
 * Si varios coinciden en hora de inicio, se marcan todos como estelares (máx. 3).
 */
export function pickSpotlightMatches(
  matches: Match[],
  liveMatches: Match[],
  now = Date.now(),
  max = MAX_SPOTLIGHT_MATCHES,
): Match[] {
  if (liveMatches.length) {
    const sortedLive = [...liveMatches].sort(
      (a, b) => matchSortTime(a) - matchSortTime(b) || a.id.localeCompare(b.id),
    )
    const firstKickoff = getKickoffTime(sortedLive[0]!)
    if (firstKickoff != null) {
      const sameKickoff = matchesAtSameKickoff(sortedLive, firstKickoff, max)
      if (sameKickoff.length > 1) return sameKickoff
    }
    return sortedLive.slice(0, max)
  }

  const recentFinished = matches
    .filter((m) => isRecentlyFinished(m, now))
    .sort((a, b) => matchSortTime(b) - matchSortTime(a) || a.id.localeCompare(b.id))

  if (recentFinished.length) {
    const firstKickoff = getKickoffTime(recentFinished[0]!)
    if (firstKickoff != null) {
      return matchesAtSameKickoff(recentFinished, firstKickoff, max)
    }
    return recentFinished.slice(0, 1)
  }

  const upcoming = matches
    .filter((m) => m.status !== 'finished' && !isEffectivelyLive(m) && m.match_date)
    .sort(
      (a, b) =>
        new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime() ||
        a.id.localeCompare(b.id),
    )

  if (!upcoming.length) return []

  const firstKickoff = getKickoffTime(upcoming[0]!)
  if (firstKickoff == null) return upcoming.slice(0, 1)

  return matchesAtSameKickoff(upcoming, firstKickoff, max)
}

/** @deprecated Preferir pickSpotlightMatches; conserva un solo partido. */
export function pickSpotlightMatch(
  matches: Match[],
  liveMatches: Match[],
  now = Date.now(),
): Match | null {
  return pickSpotlightMatches(matches, liveMatches, now, 1)[0] ?? null
}

export function pickNextScheduledMatch(matches: Match[], now = Date.now()): Match | null {
  return (
    matches
      .filter(
        (m) =>
          m.status === 'scheduled' &&
          m.match_date &&
          new Date(m.match_date).getTime() >= now,
      )
      .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())[0] ??
    null
  )
}
