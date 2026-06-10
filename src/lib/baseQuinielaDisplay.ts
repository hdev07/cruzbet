import type { Match, PredictedWinner } from '@/types'

export function actualMatchWinner(match: Match): PredictedWinner | null {
  if (match.status !== 'finished') return null
  if (match.home_score > match.away_score) return 'home'
  if (match.home_score < match.away_score) return 'away'
  return 'draw'
}

export function winnerCode(winner: PredictedWinner): string {
  if (winner === 'home') return 'L'
  if (winner === 'draw') return 'E'
  return 'V'
}

export function isPredictionCorrect(
  predicted: PredictedWinner,
  match: Match,
): boolean | null {
  const actual = actualMatchWinner(match)
  if (actual == null) return null
  return predicted === actual
}
