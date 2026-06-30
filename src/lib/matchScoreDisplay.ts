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

type KnockoutWinnerMatch = Pick<
  Match,
  | 'status'
  | 'home_score'
  | 'away_score'
  | 'penalty_home_score'
  | 'penalty_away_score'
  | 'home_team_id'
  | 'away_team_id'
>

/** Lado ganador en eliminatoria (incluye tanda de penales). */
export function matchKnockoutWinnerSide(match: KnockoutWinnerMatch): 'home' | 'away' | null {
  if (match.status !== 'finished') return null

  if (match.home_score > match.away_score) return 'home'
  if (match.away_score > match.home_score) return 'away'

  if (!hasPenaltyShootout(match)) return null
  if (match.penalty_home_score! > match.penalty_away_score!) return 'home'
  if (match.penalty_away_score! > match.penalty_home_score!) return 'away'
  return null
}
