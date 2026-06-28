import type { Match, MatchEvent, PredictedWinner } from '@/types'

/** Gol en 90 min reglamentarios + tiempo agregado (no prórroga). */
export function isRegulationTimeGoal(minute: number): boolean {
  return minute <= 90
}

export function regulationScoreFromGoals(
  goals: readonly Pick<MatchEvent, 'event_type' | 'minute' | 'team_id'>[],
  homeTeamId: string | null | undefined,
): { home: number; away: number } {
  if (!homeTeamId) return { home: 0, away: 0 }

  let home = 0
  let away = 0
  for (const event of goals) {
    if (event.event_type !== 'goal') continue
    if (!isRegulationTimeGoal(event.minute)) continue
    if (event.team_id === homeTeamId) home++
    else away++
  }
  return { home, away }
}

export function winnerFromRegulationScores(
  home: number,
  away: number,
): PredictedWinner {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

/** Marcador al pitido final del 2.º tiempo + agregado (sin prórroga). */
export function regulationScoresForMatch(
  match: Match,
  events?: readonly MatchEvent[],
): { home: number; away: number } {
  if (match.regulation_home_score != null && match.regulation_away_score != null) {
    return {
      home: match.regulation_home_score,
      away: match.regulation_away_score,
    }
  }

  const goals = events?.filter((e) => e.event_type === 'goal') ?? []
  if (goals.length > 0) {
    return regulationScoreFromGoals(goals, match.home_team_id)
  }

  return { home: match.home_score, away: match.away_score }
}
