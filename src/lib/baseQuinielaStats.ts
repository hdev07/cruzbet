import type { BasePrediction } from '@/types'

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
