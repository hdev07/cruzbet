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

export interface Prediction {
  id: number
  user_id: string
  match_id: string
  prediction_type: PredictionType
  predicted_minute: number | null
  predicted_team: 'home' | 'away' | null
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
