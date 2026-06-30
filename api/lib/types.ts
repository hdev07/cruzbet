export type MatchStatus = 'scheduled' | 'live' | 'finished'

export type ParsedGoalType = 'foot' | 'penalty' | 'own_goal' | 'header' | 'free_kick'

export type ParsedCardType = 'yellow' | 'red'

export interface ParsedGoal {
  sync_key: string
  team_side: 'home' | 'away'
  minute: number
  extra_time: number
  event_second: number
  player: string | null
  goal_type: ParsedGoalType
  source: string
}

export interface ParsedCard {
  sync_key: string
  team_side: 'home' | 'away'
  minute: number
  extra_time: number
  event_second: number
  player: string | null
  card_type: ParsedCardType
  source: string
}

export type LiveStatusDetail = 'delayed' | 'postponed' | 'suspended' | 'canceled'

export interface LiveMatchSnapshot {
  status: MatchStatus
  current_minute: number
  live_clock_display: string | null
  live_status_detail: LiveStatusDetail | null
  home_score: number
  away_score: number
  penalty_home_score?: number | null
  penalty_away_score?: number | null
  goals: ParsedGoal[]
  cards: ParsedCard[]
  external_event_id: string | null
  source: 'google' | 'espn'
}

export interface DbMatchRow {
  id: string
  home_team_id: string
  away_team_id: string
  status: MatchStatus
  phase?: string | null
  match_date: string | null
  home_score?: number | null
  away_score?: number | null
  penalty_home_score?: number | null
  penalty_away_score?: number | null
  current_minute: number | null
  live_clock_display: string | null
  auto_sync_enabled: boolean
  external_event_id: string | null
  home_team: { code: string; name: string }
  away_team: { code: string; name: string }
}
