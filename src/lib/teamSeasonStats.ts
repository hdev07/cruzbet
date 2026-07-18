import { supabase } from '@/lib/supabase'

type MatchTeamStatsRow = {
  match_id: string
  team_id: string
  possession_pct: number | null
  shots_total: number | null
  shots_on_target: number | null
  fouls: number | null
  tackles_won: number | null
  interceptions: number | null
  clearances: number | null
  passes_total: number | null
  passes_accurate: number | null
  matches: {
    home_team_id: string
    away_team_id: string
    home_score: number
    away_score: number
  }
}

export type TeamMatchStatPoint = {
  matchId: string
  possessionPct: number | null
  shotsTotal: number | null
  shotsOnTarget: number | null
  fouls: number | null
  tacklesWon: number | null
  interceptions: number | null
  clearances: number | null
  passAccuracyPct: number | null
  goalsFor: number
  goalsAgainst: number
  points: number
}

const STATS_SELECT = `
  match_id,
  team_id,
  possession_pct,
  shots_total,
  shots_on_target,
  fouls,
  tackles_won,
  interceptions,
  clearances,
  passes_total,
  passes_accurate,
  matches!inner(home_team_id, away_team_id, home_score, away_score, competition_id, status)
`

function toPoint(row: MatchTeamStatsRow): TeamMatchStatPoint {
  const isHome = row.matches.home_team_id === row.team_id
  const goalsFor = isHome ? row.matches.home_score : row.matches.away_score
  const goalsAgainst = isHome ? row.matches.away_score : row.matches.home_score
  const points = goalsFor > goalsAgainst ? 3 : goalsFor < goalsAgainst ? 0 : 1
  const passAccuracyPct =
    row.passes_total && row.passes_accurate
      ? Number(((row.passes_accurate / row.passes_total) * 100).toFixed(1))
      : null

  return {
    matchId: row.match_id,
    possessionPct: row.possession_pct,
    shotsTotal: row.shots_total,
    shotsOnTarget: row.shots_on_target,
    fouls: row.fouls,
    tacklesWon: row.tackles_won,
    interceptions: row.interceptions,
    clearances: row.clearances,
    passAccuracyPct,
    goalsFor,
    goalsAgainst,
    points,
  }
}

/** Estadísticas de boxscore (ESPN) partido a partido, para un equipo en una competencia. */
export async function fetchTeamMatchStats(
  teamId: string,
  competitionId: string,
): Promise<TeamMatchStatPoint[]> {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select(STATS_SELECT)
    .eq('team_id', teamId)
    .eq('matches.competition_id', competitionId)
    .eq('matches.status', 'finished')

  if (error || !data) return []
  return (data as unknown as MatchTeamStatsRow[]).map(toPoint)
}

export type MatchBoxscoreRow = {
  teamId: string
  possessionPct: number | null
  shotsTotal: number | null
  shotsOnTarget: number | null
  corners: number | null
  fouls: number | null
  passesTotal: number | null
  passesAccurate: number | null
}

/** Boxscore (ESPN) de un partido puntual, una fila por equipo. */
export async function fetchMatchBoxscore(matchId: string): Promise<MatchBoxscoreRow[]> {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select(
      'team_id, possession_pct, shots_total, shots_on_target, corners, fouls, passes_total, passes_accurate',
    )
    .eq('match_id', matchId)

  if (error || !data) return []
  return data.map((row) => ({
    teamId: row.team_id,
    possessionPct: row.possession_pct,
    shotsTotal: row.shots_total,
    shotsOnTarget: row.shots_on_target,
    corners: row.corners,
    fouls: row.fouls,
    passesTotal: row.passes_total,
    passesAccurate: row.passes_accurate,
  }))
}

function average(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null)
  if (!present.length) return null
  return present.reduce((sum, value) => sum + value, 0) / present.length
}

export type TeamSeasonAverages = {
  teamId: string
  matchesWithStats: number
  possessionPct: number | null
  shotsTotal: number | null
  shotsOnTarget: number | null
  goalsForPerMatch: number | null
  goalsAgainstPerMatch: number | null
  foulsPerMatch: number | null
  tacklesWon: number | null
  interceptions: number | null
  clearances: number | null
  passAccuracyPct: number | null
  conversionRatePct: number | null
}

export function summarizeSeasonAverages(teamId: string, points: TeamMatchStatPoint[]): TeamSeasonAverages {
  const totalShots = points.reduce((sum, point) => sum + (point.shotsTotal ?? 0), 0)
  const totalGoals = points.reduce((sum, point) => sum + point.goalsFor, 0)

  return {
    teamId,
    matchesWithStats: points.length,
    possessionPct: average(points.map((point) => point.possessionPct)),
    shotsTotal: average(points.map((point) => point.shotsTotal)),
    shotsOnTarget: average(points.map((point) => point.shotsOnTarget)),
    goalsForPerMatch: average(points.map((point) => point.goalsFor)),
    goalsAgainstPerMatch: average(points.map((point) => point.goalsAgainst)),
    foulsPerMatch: average(points.map((point) => point.fouls)),
    tacklesWon: average(points.map((point) => point.tacklesWon)),
    interceptions: average(points.map((point) => point.interceptions)),
    clearances: average(points.map((point) => point.clearances)),
    passAccuracyPct: average(points.map((point) => point.passAccuracyPct)),
    conversionRatePct: totalShots > 0 ? Number(((totalGoals / totalShots) * 100).toFixed(1)) : null,
  }
}

/** Promedios de boxscore de todos los equipos de la competencia (para normalizar el radar). */
export async function fetchLeagueSeasonAverages(
  competitionId: string,
): Promise<Map<string, TeamSeasonAverages>> {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select(STATS_SELECT)
    .eq('matches.competition_id', competitionId)
    .eq('matches.status', 'finished')

  if (error || !data) return new Map()

  const byTeam = new Map<string, TeamMatchStatPoint[]>()
  for (const row of data as unknown as MatchTeamStatsRow[]) {
    const list = byTeam.get(row.team_id) ?? []
    list.push(toPoint(row))
    byTeam.set(row.team_id, list)
  }

  return new Map(
    [...byTeam.entries()].map(([teamId, points]) => [teamId, summarizeSeasonAverages(teamId, points)]),
  )
}

export type RadarAxis = {
  key: string
  label: string
  value: number
  rawLabel: string
}

const RADAR_AXES: Array<{
  key: string
  label: string
  pick: (avg: TeamSeasonAverages) => number | null
  invert?: boolean
  format: (value: number) => string
}> = [
  { key: 'attack', label: 'Ataque', pick: (a) => a.goalsForPerMatch, format: (v) => `${v.toFixed(1)} goles/partido` },
  {
    key: 'defense',
    label: 'Defensa',
    pick: (a) => a.goalsAgainstPerMatch,
    invert: true,
    format: (v) => `${v.toFixed(1)} goles recibidos/partido`,
  },
  { key: 'possession', label: 'Posesión', pick: (a) => a.possessionPct, format: (v) => `${v.toFixed(0)}%` },
  {
    key: 'creation',
    label: 'Creación',
    pick: (a) => a.shotsOnTarget,
    format: (v) => `${v.toFixed(1)} tiros a puerta/partido`,
  },
  {
    key: 'effectiveness',
    label: 'Efectividad',
    pick: (a) => a.conversionRatePct,
    format: (v) => `${v.toFixed(0)}% conversión`,
  },
  {
    key: 'discipline',
    label: 'Disciplina',
    pick: (a) => a.foulsPerMatch,
    invert: true,
    format: (v) => `${v.toFixed(1)} faltas/partido`,
  },
]

function minMax(values: number[]): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 1 }
  return { min: Math.min(...values), max: Math.max(...values) }
}

/**
 * Ejes del radar de rendimiento (0-100) normalizados contra el resto de la
 * liga, para que el mismo equipo se pueda comparar contra distintos rivales
 * en una escala consistente.
 */
export function buildRadarAxes(
  teamAverages: TeamSeasonAverages,
  leagueAverages: TeamSeasonAverages[],
): RadarAxis[] {
  return RADAR_AXES.map((axis) => {
    const raw = axis.pick(teamAverages)
    const leagueValues = leagueAverages
      .map((entry) => axis.pick(entry))
      .filter((value): value is number => value !== null)
    const { min, max } = minMax(leagueValues)

    let normalized = 50
    if (raw !== null && max > min) {
      normalized = ((raw - min) / (max - min)) * 100
      if (axis.invert) normalized = 100 - normalized
    }

    return {
      key: axis.key,
      label: axis.label,
      value: Math.round(Math.min(100, Math.max(0, normalized))),
      rawLabel: raw !== null ? axis.format(raw) : 'Sin datos',
    }
  })
}
