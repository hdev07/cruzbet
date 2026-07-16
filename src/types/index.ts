export type MatchStatus = 'scheduled' | 'live' | 'finished'

export type LiveStatusDetail = 'delayed' | 'postponed' | 'suspended' | 'canceled'

export interface Competition {
  id: string
  slug: string
  name: string
  season: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type BracketSlot =
  | { type: 'group_pos'; group: string; pos: number }
  | { type: 'best_third'; groups: string[] }
  | { type: 'winner'; match: number }
  | { type: 'loser'; match: number }

export interface BracketMeta {
  match_number: number
  home: BracketSlot
  away: BracketSlot
  label?: string
}

export type EventType =
  | 'goal'
  | 'corner'
  | 'card'
  | 'offside'
  | 'penalty'
  | 'substitution'
  | 'var_review'

export interface Team {
  id: string
  name: string
  code: string
  flag_url: string | null
  group_name: string | null
  created_at?: string
}

export interface Player {
  id: string
  team_id: string
  name: string
  number: number | null
  position: string | null
  created_at?: string
  teams?: Pick<Team, 'name' | 'flag_url'>
}

export interface Match {
  id: string
  competition_id: string
  home_team_id: string | null
  away_team_id: string | null
  home_score: number
  away_score: number
  current_minute: number | null
  live_clock_display?: string | null
  live_status_detail?: LiveStatusDetail | null
  status: MatchStatus
  phase: string | null
  match_date: string | null
  venue: string | null
  bracket_key?: string | null
  bracket_meta?: BracketMeta | null
  auto_sync_enabled?: boolean
  live_sync_at?: string | null
  live_sync_error?: string | null
  external_event_id?: string | null
  created_at?: string
  home_team?: Team
  away_team?: Team
}

export interface MatchEvent {
  id: string
  match_id: string
  team_id: string | null
  player_id: string | null
  event_type: EventType
  minute: number
  extra_time: number
  event_second?: number
  metadata: Record<string, unknown>
  created_at?: string
  players?: Pick<Player, 'name' | 'number'>
  teams?: Pick<Team, 'name' | 'code' | 'flag_url'>
}

export interface Profile {
  id: string
  username: string | null
  avatar: string | null
  points: number
  created_at?: string
}

export type PredictedWinner = 'home' | 'draw' | 'away'

export interface BaseQuinielaRound {
  id: string
  competition_id: string
  round_number: number
  title: string
  match_count: number
  points_per_hit: number
  created_at?: string
}

export interface BaseQuinielaRoundMatch {
  id: string
  round_id: string
  match_id: string
  position: number
  match?: Match
}

export interface BasePrediction {
  id: number
  user_id: string
  round_id: string
  entry_number: number
  match_id: string
  predicted_winner: PredictedWinner
  points: number
  scored_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface BaseRoundLeaderboardEntry {
  round_id: string
  user_id: string
  entry_number: number
  username: string | null
  avatar: string | null
  predictions_count: number
  correct_count: number
  total_points: number
  match_count: number
  is_complete: boolean
}

export interface BaseRoundPayment {
  user_id: string
  round_id: string
  entry_number: number
  verified: boolean
  verified_at?: string | null
  submitted_at?: string | null
  created_at?: string
}

export interface BaseQuinielaEntrySummary {
  entry_number: number
  prediction_count: number
  is_submitted: boolean
  verified: boolean
}

export interface BaseRoundParticipant {
  user_id: string
  entry_number: number
  verified: boolean
  profiles?: Pick<Profile, 'username' | 'avatar'>
  predictions: BasePrediction[]
  total_points: number
  correct_count: number
  complete: boolean
}

export interface BaseRoundResultSummary {
  round: BaseQuinielaRound
  winner: BaseRoundLeaderboardEntry | null
  topThree: BaseRoundLeaderboardEntry[]
  myEntry: BaseRoundLeaderboardEntry | null
  isActive: boolean
  participantCount: number
}
