import { describe, expect, it } from 'vitest'
import {
  isStaleRegulationScore,
  regulationScoresForMatch,
  winnerFromRegulationScores,
} from './regulationScore'
import type { Match } from '@/types'

function match(overrides: Partial<Match>): Match {
  return {
    id: 'm1',
    competition_id: 'c1',
    home_team_id: 'home',
    away_team_id: 'away',
    home_score: 0,
    away_score: 0,
    current_minute: 90,
    status: 'finished',
    phase: 'Jornada 4',
    match_date: '2026-08-16T01:00:00.000Z',
    venue: null,
    ...overrides,
  }
}

describe('regulationScoresForMatch', () => {
  it('no usa un 0-0 reglamentario si el marcador oficial no es empate', () => {
    const row = match({
      home_score: 6,
      away_score: 1,
      regulation_home_score: 0,
      regulation_away_score: 0,
    })

    expect(isStaleRegulationScore(row)).toBe(true)
    expect(regulationScoresForMatch(row)).toEqual({ home: 6, away: 1 })
    expect(winnerFromRegulationScores(6, 1)).toBe('home')
  })

  it('conserva un 0-0 real', () => {
    const row = match({
      home_score: 0,
      away_score: 0,
      regulation_home_score: 0,
      regulation_away_score: 0,
    })

    expect(isStaleRegulationScore(row)).toBe(false)
    expect(regulationScoresForMatch(row)).toEqual({ home: 0, away: 0 })
    expect(winnerFromRegulationScores(0, 0)).toBe('draw')
  })

  it('usa el marcador reglamentario cuando no está stale', () => {
    const row = match({
      home_score: 2,
      away_score: 1,
      regulation_home_score: 1,
      regulation_away_score: 1,
    })

    expect(regulationScoresForMatch(row)).toEqual({ home: 1, away: 1 })
  })
})
