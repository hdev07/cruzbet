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
}

export interface SyncResult {
  processed: number
  matched: number
  updated: number
  skipped: number
  errors: string[]
}
