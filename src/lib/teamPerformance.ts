import { supabase } from '@/lib/supabase'
import { buildStandings, type StandingsMatchSource, type StandingsTeamInfo } from '@/lib/standings'
import { teamNameFromCode } from '@/lib/teamDisplay'
import type { Match } from '@/types'

function clubName(code: string, fallback?: string): string {
  return teamNameFromCode(code) ?? fallback ?? code
}

export type FormResult = 'W' | 'D' | 'L'

export type FormPoint = {
  matchId: string
  date: string | null
  opponentCode: string | null
  goalsFor: number
  goalsAgainst: number
  points: number
  result: FormResult
}

function isTeamMatch(match: Match, teamId: string): boolean {
  return match.home_team_id === teamId || match.away_team_id === teamId
}

/** Puntos (3/1/0) de los últimos `limit` partidos finalizados del equipo, en orden cronológico. */
export function buildFormPoints(matches: Match[], teamId: string, limit = 10): FormPoint[] {
  const finished = matches
    .filter((match) => match.status === 'finished' && isTeamMatch(match, teamId))
    .slice(-limit)

  return finished.map((match) => {
    const isHome = match.home_team_id === teamId
    const goalsFor = isHome ? match.home_score : match.away_score
    const goalsAgainst = isHome ? match.away_score : match.home_score
    const opponent = isHome ? match.away_team : match.home_team
    const result: FormResult = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D'

    return {
      matchId: match.id,
      date: match.match_date,
      opponentCode: opponent?.code ?? null,
      goalsFor,
      goalsAgainst,
      points: result === 'W' ? 3 : result === 'D' ? 1 : 0,
      result,
    }
  })
}

export type HomeAwaySplit = {
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  pointsPerMatch: number
  goalsForPerMatch: number
  goalsAgainstPerMatch: number
}

function emptySplit(): HomeAwaySplit {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    pointsPerMatch: 0,
    goalsForPerMatch: 0,
    goalsAgainstPerMatch: 0,
  }
}

/** Compara el rendimiento del equipo como local vs. como visitante. */
export function buildHomeAwaySplit(
  matches: Match[],
  teamId: string,
): { home: HomeAwaySplit; away: HomeAwaySplit } {
  const home = emptySplit()
  const away = emptySplit()

  for (const match of matches) {
    if (match.status !== 'finished') continue
    const isHome = match.home_team_id === teamId
    const isAway = match.away_team_id === teamId
    if (!isHome && !isAway) continue

    const split = isHome ? home : away
    const goalsFor = isHome ? match.home_score : match.away_score
    const goalsAgainst = isHome ? match.away_score : match.home_score

    split.played += 1
    split.goalsFor += goalsFor
    split.goalsAgainst += goalsAgainst
    if (goalsFor > goalsAgainst) split.won += 1
    else if (goalsFor < goalsAgainst) split.lost += 1
    else split.drawn += 1
  }

  for (const split of [home, away]) {
    if (split.played === 0) continue
    const points = split.won * 3 + split.drawn
    split.pointsPerMatch = Number((points / split.played).toFixed(2))
    split.goalsForPerMatch = Number((split.goalsFor / split.played).toFixed(2))
    split.goalsAgainstPerMatch = Number((split.goalsAgainst / split.played).toFixed(2))
  }

  return { home, away }
}

export type JornadaGoals = {
  jornada: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
}

/** Goles a favor/en contra del equipo por jornada, dentro de una sola competencia. */
export function buildGoalsByJornada(
  matches: Match[],
  jornadaByMatch: Map<string, number>,
  teamId: string,
): JornadaGoals[] {
  const byJornada = new Map<number, JornadaGoals>()

  for (const match of matches) {
    if (match.status !== 'finished' || !isTeamMatch(match, teamId)) continue
    const jornada = jornadaByMatch.get(match.id)
    if (!jornada) continue

    const isHome = match.home_team_id === teamId
    const goalsFor = isHome ? match.home_score : match.away_score
    const goalsAgainst = isHome ? match.away_score : match.home_score

    const bucket = byJornada.get(jornada) ?? { jornada, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }
    bucket.goalsFor += goalsFor
    bucket.goalsAgainst += goalsAgainst
    bucket.goalDiff = bucket.goalsFor - bucket.goalsAgainst
    byJornada.set(jornada, bucket)
  }

  return [...byJornada.values()].sort((a, b) => a.jornada - b.jornada)
}

const GOAL_PERIOD_LABELS = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90+'] as const

export type GoalPeriodBucket = {
  label: (typeof GOAL_PERIOD_LABELS)[number]
  scored: number
  conceded: number
}

function periodIndex(minute: number): number {
  if (minute > 90) return 5
  return Math.min(Math.ceil(Math.max(minute, 1) / 15), 6) - 1
}

export type TeamGoalEvent = {
  matchId: string
  teamId: string | null
  minute: number
}

/** Goles anotados/recibidos del equipo agrupados en intervalos de 15 minutos. */
export function buildGoalsByPeriod(
  events: TeamGoalEvent[],
  matches: Match[],
  teamId: string,
): GoalPeriodBucket[] {
  const buckets = GOAL_PERIOD_LABELS.map((label) => ({ label, scored: 0, conceded: 0 }))
  const matchById = new Map(matches.map((match) => [match.id, match]))

  for (const event of events) {
    const match = matchById.get(event.matchId)
    if (!match || !isTeamMatch(match, teamId)) continue

    const bucket = buckets[periodIndex(event.minute)]
    if (!bucket) continue
    if (event.teamId === teamId) bucket.scored += 1
    else bucket.conceded += 1
  }

  return buckets
}

/** Mapa match_id -> número de jornada para una competencia, vía base_quiniela_round_matches. */
export async function fetchJornadaByMatch(competitionId: string): Promise<Map<string, number>> {
  const { data } = await supabase
    .from('base_quiniela_round_matches')
    .select('match_id, base_quiniela_rounds!inner(round_number, competition_id)')
    .eq('base_quiniela_rounds.competition_id', competitionId)

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const round = row.base_quiniela_rounds as unknown as { round_number: number } | null
    if (round) map.set(row.match_id, round.round_number)
  }
  return map
}

/** Goles (event_type='goal') de los partidos indicados, con minuto y equipo anotador. */
export async function fetchGoalEvents(matchIds: string[]): Promise<TeamGoalEvent[]> {
  if (!matchIds.length) return []

  const events: TeamGoalEvent[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('match_events')
      .select('match_id, team_id, minute')
      .in('match_id', matchIds)
      .eq('event_type', 'goal')
      .range(from, from + pageSize - 1)

    if (error) break
    const page = data ?? []
    for (const row of page) {
      events.push({ matchId: row.match_id, teamId: row.team_id, minute: row.minute })
    }
    if (page.length < pageSize) break
  }
  return events
}

export type StandingsProgressionPoint = {
  jornada: number
  position: number
  points: number
}

/**
 * Posición del equipo en la tabla general acumulada hasta cada jornada
 * (recalcula standings con los partidos de la competencia jugados hasta ese
 * punto, igual que `buildStandings`, pero incrementalmente por jornada).
 */
export async function fetchStandingsProgression(
  competitionId: string,
  teamCode: string,
  participants?: StandingsTeamInfo[],
): Promise<StandingsProgressionPoint[]> {
  const [{ data: matches }, { data: teamRows }, jornadaByMatch] = await Promise.all([
    supabase
      .from('matches')
      .select('id, status, home_score, away_score, home_team_id, away_team_id')
      .eq('competition_id', competitionId),
    supabase.from('teams').select('id, code, name'),
    fetchJornadaByMatch(competitionId),
  ])

  const teamMap = new Map<string, StandingsTeamInfo>(
    (teamRows ?? []).map((row) => [row.id, { code: row.code, name: clubName(row.code, row.name) }]),
  )

  const matchList = ((matches ?? []) as StandingsMatchSource[]).filter(
    (match) => match.status === 'finished' && jornadaByMatch.has(match.id),
  )

  const jornadas = [...new Set([...jornadaByMatch.values()])].sort((a, b) => a - b)

  const progression: StandingsProgressionPoint[] = []
  for (const jornada of jornadas) {
    const matchesUpToJornada = matchList.filter(
      (match) => (jornadaByMatch.get(match.id) ?? Infinity) <= jornada,
    )
    if (!matchesUpToJornada.length) continue

    const standings = buildStandings(matchesUpToJornada, teamMap, participants)
    const row = standings.find((entry) => entry.teamCode === teamCode)
    if (row) progression.push({ jornada, position: row.position, points: row.points })
  }

  return progression
}
