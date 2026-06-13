export type MatchStatus = 'scheduled' | 'live' | 'finished'

export interface ParsedGoal {
  sync_key: string
  team_side: 'home' | 'away'
  minute: number
  extra_time: number
  event_second: number
  player: string | null
  source: string
}

export interface LiveMatchSnapshot {
  status: MatchStatus
  current_minute: number
  live_clock_display: string | null
  home_score: number
  away_score: number
  goals: ParsedGoal[]
  external_event_id: string | null
  source: 'google' | 'espn'
}

export interface DbMatchRow {
  id: string
  home_team_id: string
  away_team_id: string
  status: MatchStatus
  match_date: string | null
  auto_sync_enabled: boolean
  external_event_id: string | null
  home_team: { code: string; name: string }
  away_team: { code: string; name: string }
}
