import type { Match, MatchStatus } from '../types'

/** Duración estimada: 45' + 15' descanso + 45' + 10' de agregado */
export const MATCH_FIRST_HALF_MIN = 45
export const MATCH_HALFTIME_MIN = 15
export const MATCH_SECOND_HALF_MIN = 45
export const MATCH_STOPPAGE_MIN = 10
export const MATCH_TOTAL_DURATION_MIN =
  MATCH_FIRST_HALF_MIN + MATCH_HALFTIME_MIN + MATCH_SECOND_HALF_MIN + MATCH_STOPPAGE_MIN

export function getKickoffTime(match: Pick<Match, 'match_date'>): number | null {
  if (!match.match_date) return null
  return new Date(match.match_date).getTime()
}

export function getElapsedMinutesSinceKickoff(
  match: Pick<Match, 'match_date'>,
  now = Date.now(),
): number | null {
  const kickoff = getKickoffTime(match)
  if (kickoff === null) return null
  return Math.floor((now - kickoff) / 60_000)
}

/** Solo para estimaciones locales; el sync ESPN es la fuente de verdad del minuto. */
export function estimateCurrentMinuteFromKickoff(
  match: Pick<Match, 'match_date'>,
  now = Date.now(),
): number {
  const elapsed = getElapsedMinutesSinceKickoff(match, now)
  if (elapsed === null || elapsed < 0) return 0
  if (elapsed <= MATCH_FIRST_HALF_MIN) return elapsed
  if (elapsed <= MATCH_FIRST_HALF_MIN + MATCH_HALFTIME_MIN) return MATCH_FIRST_HALF_MIN
  const secondHalfMin = elapsed - MATCH_FIRST_HALF_MIN - MATCH_HALFTIME_MIN
  return Math.min(
    MATCH_FIRST_HALF_MIN + secondHalfMin,
    MATCH_FIRST_HALF_MIN + MATCH_SECOND_HALF_MIN + MATCH_STOPPAGE_MIN,
  )
}

/** El estado en vivo lo define el sync (ESPN), no la hora programada del kickoff. */
export function getEffectiveMatchStatus(match: Match, _now = Date.now()): MatchStatus {
  if (match.status === 'finished') return 'finished'
  if (match.status === 'live') return 'live'
  return 'scheduled'
}

export function withEffectiveMatchState(match: Match, now = Date.now()): Match {
  const status = getEffectiveMatchStatus(match, now)
  if (status === match.status) return match
  return { ...match, status }
}

export function isEffectivelyLive(match: Match, now = Date.now()): boolean {
  return getEffectiveMatchStatus(match, now) === 'live'
}
