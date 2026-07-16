import { isProvisionalPredictionCorrect } from '@/lib/baseQuinielaDisplay'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import type {
  BasePrediction,
  BaseQuinielaRoundMatch,
  BaseRoundLeaderboardEntry,
  BaseRoundParticipant,
  Match,
  PredictedWinner,
} from '@/types'

export type BaseRoundRankRow =
  | BaseRoundLeaderboardEntry
  | BaseRoundParticipant
  | {
      correct_count: number
      total_points: number
      user_id: string
      entry_number: number
      username?: string | null
      profiles?: { username?: string | null }
    }

export function rankDisplayName(row: BaseRoundRankRow): string {
  if ('username' in row && row.username != null) return row.username
  if ('profiles' in row && row.profiles?.username) return row.profiles.username
  return ''
}

export type CompareBaseRoundRankOptions = {
  /** Aciertos provisionales en partidos en vivo (desempate). */
  liveHitsA?: number
  liveHitsB?: number
}

/**
 * Orden tabla comparativa: puntos/aciertos ↓ → acierto en vivo ↓ → nombre ↑ → quiniela ↑.
 * El número de posición se asigna aparte con denseRankNumbers (empatados comparten lugar).
 */
export function compareBaseRoundRank(
  a: BaseRoundRankRow,
  b: BaseRoundRankRow,
  options?: CompareBaseRoundRankOptions,
): number {
  if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
  if (b.total_points !== a.total_points) return b.total_points - a.total_points
  const liveA = options?.liveHitsA ?? 0
  const liveB = options?.liveHitsB ?? 0
  if (liveB !== liveA) return liveB - liveA
  const byName = rankDisplayName(a).localeCompare(rankDisplayName(b), 'es', {
    sensitivity: 'base',
  })
  if (byName !== 0) return byName
  if (a.entry_number !== b.entry_number) return a.entry_number - b.entry_number
  return a.user_id.localeCompare(b.user_id)
}

/** Cuántos partidos en vivo tiene acertados de forma provisional (marcador actual). */
export function countLiveProvisionalHits(
  predictions: readonly Pick<BasePrediction, 'match_id' | 'predicted_winner'>[],
  roundMatches: readonly Pick<BaseQuinielaRoundMatch, 'match_id' | 'match'>[],
): number {
  const byMatch = new Map(
    predictions.map((p) => [p.match_id, p.predicted_winner as PredictedWinner]),
  )
  let hits = 0
  for (const row of roundMatches) {
    const match = row.match as Match | null | undefined
    if (!match || !isEffectivelyLive(match)) continue
    const predicted = byMatch.get(row.match_id)
    if (predicted == null) continue
    if (isProvisionalPredictionCorrect(predicted, match)) hits += 1
  }
  return hits
}

/**
 * Posiciones densas por puntos/aciertos (1,1,2…): mismos puntos → mismo número.
 * `entries` debe ir ya ordenado (p. ej. con compareBaseRoundRank).
 */
export function denseRankNumbers(
  entries: readonly { correct_count: number; total_points: number }[],
): number[] {
  const ranks: number[] = []
  let rank = 0
  let prevKey: string | null = null
  for (const entry of entries) {
    const key = `${entry.correct_count}:${entry.total_points}`
    if (key !== prevKey) {
      rank += 1
      prevKey = key
    }
    ranks.push(rank)
  }
  return ranks
}

export function denseRankAt(
  entries: readonly { correct_count: number; total_points: number }[],
  index: number,
): number | null {
  if (index < 0 || index >= entries.length) return null
  return denseRankNumbers(entries)[index] ?? null
}

export interface BasePredictionSummary {
  picks_count: number
  correct_count: number
  total_points: number
  scored_count: number
  pending_count: number
  is_fully_scored: boolean
}

export function summarizeBasePredictions(
  predictions: BasePrediction[],
  matchCount?: number,
): BasePredictionSummary {
  const picks_count = predictions.length
  const total_points = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)
  const correct_count = predictions.filter((p) => p.points > 0).length
  const scored_count = predictions.filter((p) => p.scored_at).length
  const pending_count = picks_count - scored_count
  const expected = matchCount ?? picks_count

  return {
    picks_count,
    correct_count,
    total_points,
    scored_count,
    pending_count,
    is_fully_scored: expected > 0 && scored_count >= expected,
  }
}

export function formatRoundScoreSummary(summary: BasePredictionSummary): string {
  if (summary.pending_count > 0) {
    return `${summary.correct_count} aciertos · ${summary.total_points} pts · ${summary.pending_count} pend.`
  }
  return `${summary.correct_count} aciertos · ${summary.total_points} pts`
}

export interface LeaderboardNeighbors {
  position: number | null
  above: BaseRoundLeaderboardEntry | null
  me: BaseRoundLeaderboardEntry | null
  below: BaseRoundLeaderboardEntry | null
}

export function getLeaderboardNeighbors(
  leaderboard: BaseRoundLeaderboardEntry[],
  userId: string,
  entryNumber?: number,
): LeaderboardNeighbors {
  const idx = leaderboard.findIndex((e) =>
    entryNumber != null
      ? e.user_id === userId && e.entry_number === entryNumber
      : e.user_id === userId,
  )
  if (idx < 0) {
    return { position: null, above: null, me: null, below: null }
  }
  return {
    position: denseRankAt(leaderboard, idx),
    above: idx > 0 ? leaderboard[idx - 1]! : null,
    me: leaderboard[idx]!,
    below: idx < leaderboard.length - 1 ? leaderboard[idx + 1]! : null,
  }
}

export function validateEntryName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'El nombre no puede estar vacío'
  if (trimmed.length > 30) return 'Máximo 30 caracteres'
  return null
}

export function formatEntryLabel(
  entryNumber: number,
  customName?: string | null,
): string {
  const trimmed = customName?.trim()
  if (trimmed) return trimmed
  return entryNumber === 1 ? 'Quiniela 1' : `Quiniela ${entryNumber}`
}

export function aciertosDiffLabel(myCorrect: number, otherCorrect: number): string {
  const diff = otherCorrect - myCorrect
  if (diff === 0) return 'Empatado'
  if (diff === 1) return '+1 acierto'
  if (diff === -1) return '−1 acierto'
  if (diff > 0) return `+${diff} aciertos`
  return `${diff} aciertos`
}
