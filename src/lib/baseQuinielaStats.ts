import type { BasePrediction, BaseRoundLeaderboardEntry } from '@/types'

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
    position: idx + 1,
    above: idx > 0 ? leaderboard[idx - 1]! : null,
    me: leaderboard[idx]!,
    below: idx < leaderboard.length - 1 ? leaderboard[idx + 1]! : null,
  }
}

export function formatEntryLabel(entryNumber: number): string {
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
