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

export function resolveUpcomingBaseRounds(
  rounds: BaseQuinielaRound[],
  activeRound: BaseQuinielaRound | null,
): BaseQuinielaRound[] {
  if (!activeRound) return []

  return [...rounds]
    .filter((round) => round.round_number > activeRound.round_number)
    .sort((a, b) => a.round_number - b.round_number)
}

export function resolveNextBaseRound(
  rounds: BaseQuinielaRound[],
  activeRound: BaseQuinielaRound | null,
): BaseQuinielaRound | null {
  const upcoming = resolveUpcomingBaseRounds(rounds, activeRound)
  return upcoming[0] ?? null
}

type RoundMatchKickoffRow = {
  match?: { status?: string; match_date?: string | null } | null
}

export function countRoundMatchesStarted(
  matches: RoundMatchKickoffRow[],
  now = Date.now(),
): number {
  return matches.filter((row) => {
    const match = row.match
    if (!match) return false
    if (match.status === 'live' || match.status === 'finished') return true
    if (!match.match_date) return false
    return new Date(match.match_date).getTime() <= now
  }).length
}

export function isRoundPastHalfway(matchCount: number, startedCount: number): boolean {
  if (matchCount <= 0) return false
  return startedCount >= Math.ceil(matchCount / 2)
}

/** Momento (ms) en que se abre la siguiente jornada: mitad del intervalo entre kickoffs. */
export function nextRoundOpensAtMs(
  activeRoundId: string,
  nextRoundId: string,
  firstKickoffByRoundId: Record<string, number | null>,
): number | null {
  const activeStart = firstKickoffByRoundId[activeRoundId]
  const nextStart = firstKickoffByRoundId[nextRoundId]
  if (activeStart == null || nextStart == null) return null
  return activeStart + (nextStart - activeStart) / 2
}

/** Mitad del intervalo entre el primer partido de la jornada activa y el de la siguiente. */
export function isActiveRoundPastHalfwayByKickoff(
  activeRoundId: string,
  nextRoundId: string,
  firstKickoffByRoundId: Record<string, number | null>,
  now = Date.now(),
): boolean {
  const activeStart = firstKickoffByRoundId[activeRoundId]
  if (activeStart == null || now < activeStart) return false

  const midpoint = nextRoundOpensAtMs(activeRoundId, nextRoundId, firstKickoffByRoundId)
  return midpoint != null && now >= midpoint
}

export type RoundFillState = {
  /** ¿Se pueden marcar picks en esta jornada ahora mismo? */
  open: boolean
  /** Solo para la jornada siguiente: cuándo se abre (ms), si se conoce. */
  opensAtMs: number | null
}

/**
 * Regla de llenado: solo se llenan la jornada activa y la siguiente,
 * y la siguiente se abre a mitad de la jornada activa (punto medio entre
 * kickoffs). Jornadas posteriores quedan bloqueadas.
 *
 * La jornada activa y las pasadas se consideran abiertas aquí: sus candados
 * reales son por partido (kickoff). Si faltan datos para resolver la regla,
 * no se bloquea — los candados por partido siguen aplicando.
 */
export function resolveRoundFillState(
  roundId: string,
  rounds: BaseQuinielaRound[],
  firstKickoffByRoundId: Record<string, number | null>,
  now = Date.now(),
): RoundFillState {
  const active = resolveActiveBaseRound(rounds, firstKickoffByRoundId, now)
  const target = rounds.find((r) => r.id === roundId)
  if (!active || !target) return { open: true, opensAtMs: null }

  if (target.round_number <= active.round_number) {
    return { open: true, opensAtMs: null }
  }

  const next = resolveNextBaseRound(rounds, active)
  if (next && target.id === next.id) {
    return {
      open: isActiveRoundPastHalfwayByKickoff(
        active.id,
        next.id,
        firstKickoffByRoundId,
        now,
      ),
      opensAtMs: nextRoundOpensAtMs(active.id, next.id, firstKickoffByRoundId),
    }
  }

  return { open: false, opensAtMs: null }
}

/** Etiqueta legible de cuándo se abre una jornada (ej. "lunes 3 nov, 08:00 p.m."). */
export function formatRoundOpensAt(ms: number): string {
  return new Date(ms).toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
