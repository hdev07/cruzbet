import {
  regulationScoresForMatch,
  winnerFromRegulationScores,
} from '@/lib/regulationScore'
import type { Match, MatchEvent, PredictedWinner } from '@/types'

export function actualMatchWinner(
  match: Match,
  events?: readonly MatchEvent[],
): PredictedWinner | null {
  if (match.status !== 'finished') return null
  const { home, away } = regulationScoresForMatch(match, events)
  return winnerFromRegulationScores(home, away)
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
  events?: readonly MatchEvent[],
): boolean | null {
  const actual = actualMatchWinner(match, events)
  if (actual == null) return null
  return predicted === actual
}
