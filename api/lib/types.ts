export type MatchStatus = 'scheduled' | 'live' | 'finished'

export type SyncedEventType = 'goal' | 'card' | 'var_review' | 'substitution'

export type TeamSide = 'home' | 'away' | null

export interface DbTeamRef {
  code: string
  name: string
}

export interface DbMatchRow {
  id: string
  status: MatchStatus
  match_date: string | null
  current_minute: number | null
  live_clock_display: string | null
  auto_sync_enabled: boolean
  external_event_id: string | null
  home_team: DbTeamRef
  away_team: DbTeamRef
}

export interface SyncedMatchEvent {
  external_event_id: string
  event_type: SyncedEventType
  team_side: TeamSide
  minute: number
  extra_time: number
  event_second: number
  metadata: Record<string, unknown>
}

export interface TeamMatchStats {
  team_side: TeamSide
  possession_pct: number | null
  shots_total: number | null
  shots_on_target: number | null
  corners: number | null
  fouls: number | null
  saves: number | null
  passes_total: number | null
  passes_accurate: number | null
  tackles_total: number | null
  tackles_won: number | null
  interceptions: number | null
  clearances: number | null
  crosses_total: number | null
  crosses_accurate: number | null
}

export interface EspnMatchSnapshot {
  provider: 'espn'
  external_event_id: string
  scheduled_at: string | null
  status: MatchStatus
  status_detail: string | null
  current_minute: number | null
  clock: string | null
  home_score: number
  away_score: number
  events_complete: boolean
  events: SyncedMatchEvent[]
  team_stats: TeamMatchStats[]
}

export interface SyncResult {
  processed: number
  matched: number
  updated: number
  skipped: number
  errors: string[]
}
