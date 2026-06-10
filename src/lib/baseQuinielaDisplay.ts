import type { Match, PredictedWinner } from '@/types'

export function actualMatchWinner(match: Match): PredictedWinner | null {
  if (match.status !== 'finished') return null
  if (match.home_score > match.away_score) return 'home'
  if (match.home_score < match.away_score) return 'away'
  return 'draw'
}

export const BASE_WINNER_OPTIONS: {
  key: PredictedWinner
  code: string
  label: string
}[] = [
  { key: 'home', code: 'L', label: 'Local' },
  { key: 'draw', code: 'E', label: 'Empate' },
  { key: 'away', code: 'V', label: 'Visita' },
]

export function winnerCode(winner: PredictedWinner): string {
  return BASE_WINNER_OPTIONS.find((o) => o.key === winner)?.code ?? 'V'
}

export function winnerLabel(winner: PredictedWinner): string {
  return BASE_WINNER_OPTIONS.find((o) => o.key === winner)?.label ?? 'Visita'
}

export function isPredictionCorrect(
  predicted: PredictedWinner,
  match: Match,
): boolean | null {
  const actual = actualMatchWinner(match)
  if (actual == null) return null
  return predicted === actual
}
