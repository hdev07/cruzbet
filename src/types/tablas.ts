export type CompetitionOption = {
  id: string
  slug: string
  name: string
  season: string
  isActive: boolean
}

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

/** Regla de menores Liga MX (minutos oficiales). */
export type MenoresStandingRow = {
  position: number
  teamCode: string
  teamName: string
  playersAccumulated: number
  minutesAccumulated: number
  minutesToRegulation: number
  minutesRemaining: number
  fulfilled: boolean
  minutes2003: number
  minutes2004: number
  minutes2005: number
  minutes2006Plus: number
}

export type ScorerRow = {
  position: number
  playerName: string
  teamCode: string
  teamName: string
  goals: number
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
