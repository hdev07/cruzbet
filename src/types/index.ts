export type MatchStatus = 'scheduled' | 'live' | 'finished'

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
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  current_minute: number | null
  status: MatchStatus
  phase: string | null
  match_date: string | null
  venue: string | null
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

export type PredictionType = 'goal' | 'score'

export type PredictedWinner = 'home' | 'draw' | 'away'

export interface Prediction {
  id: number
  user_id: string
  match_id: string
  prediction_type: PredictionType
  predicted_minute: number | null
  predicted_team?: 'home' | 'away' | null
  predicted_winner?: PredictedWinner | null
  predicted_home_score?: number | null
  predicted_away_score?: number | null
  created_at?: string
  points: number
  score_points?: number
  scored_at?: string | null
  profiles?: Pick<Profile, 'username' | 'avatar'>
  profile?: Pick<Profile, 'username' | 'avatar'>
}

export interface PredictionWithMatch extends Prediction {
  match?: Match
}

export interface MatchPayment {
  user_id: string
  match_id: string
  verified: boolean
  verified_at?: string | null
  created_at?: string
}

export interface MatchParticipant {
  user_id: string
  verified: boolean
  profiles?: Pick<Profile, 'username' | 'avatar'>
  predictions: Prediction[]
  total_points: number
  complete?: boolean
}

export interface BaseQuinielaRound {
  id: string
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
  verified: boolean
  verified_at?: string | null
  submitted_at?: string | null
  created_at?: string
}

export interface BaseRoundParticipant {
  user_id: string
  verified: boolean
  profiles?: Pick<Profile, 'username' | 'avatar'>
  predictions: BasePrediction[]
  total_points: number
  correct_count: number
  complete: boolean
}
