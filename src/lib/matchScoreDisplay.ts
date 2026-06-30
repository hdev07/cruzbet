import type { Match } from '@/types'

export function hasPenaltyShootout(match: Pick<Match, 'penalty_home_score' | 'penalty_away_score'>): boolean {
  return match.penalty_home_score != null && match.penalty_away_score != null
}

/** Marcador de juego (90+agregado); si hubo penales, no incluye la tanda. */
export function displayRegulationScore(
  match: Pick<
    Match,
    'home_score' | 'away_score' | 'regulation_home_score' | 'regulation_away_score' | 'penalty_home_score' | 'penalty_away_score'
  >,
): { home: number; away: number } {
  if (hasPenaltyShootout(match)) {
    return {
      home: match.regulation_home_score ?? match.home_score,
      away: match.regulation_away_score ?? match.away_score,
    }
  }
  return { home: match.home_score, away: match.away_score }
}

export function penaltyShootoutLabel(
  match: Pick<Match, 'penalty_home_score' | 'penalty_away_score'>,
): string | null {
  if (!hasPenaltyShootout(match)) return null
  return `Pen. ${match.penalty_home_score}-${match.penalty_away_score}`
}
