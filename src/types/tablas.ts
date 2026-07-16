export type StandingRow = {
  position: number
  teamCode: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export type ScorerRow = {
  position: number
  playerName: string
  teamCode: string
  teamName: string
  goals: number
}

export type TournamentHighlight = {
  title: string
  subtitle: string
  value: number
  unit: string
  secondaryLabel?: string
  secondaryValue?: number
  secondaryUnit?: string
  entityName: string
  entityKind: 'player' | 'club' | 'generic'
  teamCode?: string | null
}

export type FairPlayClubRow = {
  position: number
  teamCode: string
  teamName: string
  yellow: number
  red: number
  points: number
}

export type CardTotals = {
  yellow: number
  red: number
  fouls: number
}

export type CardMinuteBucket = {
  label: string
  yellow: number
  red: number
}

export type CardJornadaBucket = {
  jornada: number
  yellow: number
  red: number
  fouls: number
}
