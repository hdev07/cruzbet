import type { Match } from '@/types'

export const ADMIN_EMAIL = 'hcruz0716@gmail.com'

/** Kickoff pasó: por match_date o, sin fecha, cuando el partido ya está live/finished */
export function hasKickoffPassed(match: Match): boolean {
  if (match.match_date) {
    return Date.now() >= new Date(match.match_date).getTime()
  }
  return match.status === 'live' || match.status === 'finished'
}

/** Alias semántico para UI (partido en curso o terminado) */
export function hasMatchStarted(match: Match): boolean {
  return hasKickoffPassed(match)
}

/** Predicción y edición permitidas hasta el kickoff (no cuando el admin pone live antes) */
export function isMatchOpenForPredictions(match: Match): boolean {
  if (match.status === 'finished') return false
  return !hasKickoffPassed(match)
}

export function formatKickoff(match: Match): string | null {
  if (!match.match_date) return null
  return new Date(match.match_date).toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function predictionsCloseMessage(match: Match): string {
  const kickoff = formatKickoff(match)
  if (kickoff) return `Puedes editar hasta el inicio (${kickoff})`
  return 'Puedes editar hasta que empiece el partido'
}
