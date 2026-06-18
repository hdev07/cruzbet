import { actualMatchWinner } from '@/lib/baseQuinielaDisplay'
import { computeGroupStandings } from '@/lib/groupStandings'
import type { Match, Team } from '@/types'

export type TeamFormResult = 'W' | 'D' | 'L'

export interface TeamLastMatch {
  match: Match
  teamScore: number
  opponentScore: number
  opponent: Team | null
  isHome: boolean
  result: TeamFormResult
}

export interface TeamMatchContext {
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  goalDiff: number
  form: TeamFormResult[]
  lastMatch: TeamLastMatch | null
  groupName: string | null
  groupPosition: number | null
}

export interface HeadToHeadEntry {
  match: Match
  homeScore: number
  awayScore: number
}

export interface HeadToHeadSummary {
  homeWins: number
  draws: number
  awayWins: number
  recent: HeadToHeadEntry[]
}

export interface MatchContext {
  home: TeamMatchContext
  away: TeamMatchContext
  headToHead: HeadToHeadSummary | null
}

function matchSortTime(match: Match): number {
  const date = match.match_date ?? match.created_at
  return date ? new Date(date).getTime() : 0
}

function extractTeamsFromMatches(matches: Match[]): Team[] {
  const map = new Map<string, Team>()
  for (const match of matches) {
    if (match.home_team) map.set(match.home_team.id, match.home_team)
    if (match.away_team) map.set(match.away_team.id, match.away_team)
  }
  return [...map.values()]
}

function teamResultInMatch(teamId: string, match: Match): TeamFormResult | null {
  if (match.status !== 'finished' || !match.home_team_id || !match.away_team_id) return null

  const hs = match.home_score
  const as = match.away_score

  if (teamId === match.home_team_id) {
    if (hs > as) return 'W'
    if (hs < as) return 'L'
    return 'D'
  }

  if (teamId === match.away_team_id) {
    if (as > hs) return 'W'
    if (as < hs) return 'L'
    return 'D'
  }

  return null
}

function getTeamFinishedMatches(
  teamId: string,
  allMatches: Match[],
  beforeMatch?: Match,
  excludeMatchId?: string,
): Match[] {
  const beforeTime = beforeMatch ? matchSortTime(beforeMatch) : Number.POSITIVE_INFINITY

  return allMatches
    .filter((match) => {
      if (match.id === excludeMatchId) return false
      if (match.status !== 'finished') return false
      if (!match.home_team_id || !match.away_team_id) return false
      if (match.home_team_id !== teamId && match.away_team_id !== teamId) return false
      return matchSortTime(match) < beforeTime
    })
    .sort((a, b) => matchSortTime(b) - matchSortTime(a))
}

function getGroupPosition(
  teamId: string,
  allMatches: Match[],
): { groupName: string; position: number } | null {
  const teams = extractTeamsFromMatches(allMatches).filter((team) => team.group_name)
  if (!teams.some((team) => team.id === teamId)) return null

  const standings = computeGroupStandings(teams, allMatches)
  for (const group of standings) {
    const row = group.rows.find((entry) => entry.team.id === teamId)
    if (row) {
      return { groupName: group.groupName, position: row.position }
    }
  }

  return null
}

export function buildTeamMatchContext(
  teamId: string,
  team: Team | null | undefined,
  allMatches: Match[],
  options?: { beforeMatch?: Match; excludeMatchId?: string; formLimit?: number },
): TeamMatchContext {
  const formLimit = options?.formLimit ?? 5
  const finished = getTeamFinishedMatches(
    teamId,
    allMatches,
    options?.beforeMatch,
    options?.excludeMatchId,
  )

  let won = 0
  let drawn = 0
  let lost = 0
  let goalsFor = 0
  let goalsAgainst = 0
  const form: TeamFormResult[] = []

  for (const match of finished) {
    const result = teamResultInMatch(teamId, match)
    if (!result) continue

    if (form.length < formLimit) form.push(result)

    const isHome = match.home_team_id === teamId
    goalsFor += isHome ? match.home_score : match.away_score
    goalsAgainst += isHome ? match.away_score : match.home_score

    if (result === 'W') won++
    else if (result === 'D') drawn++
    else lost++
  }

  const groupInfo = getGroupPosition(teamId, allMatches)
  const lastFinished = finished[0] ?? null
  let lastMatch: TeamLastMatch | null = null

  if (lastFinished) {
    const isHome = lastFinished.home_team_id === teamId
    const result = teamResultInMatch(teamId, lastFinished)
    if (result) {
      lastMatch = {
        match: lastFinished,
        teamScore: isHome ? lastFinished.home_score : lastFinished.away_score,
        opponentScore: isHome ? lastFinished.away_score : lastFinished.home_score,
        opponent: isHome ? (lastFinished.away_team ?? null) : (lastFinished.home_team ?? null),
        isHome,
        result,
      }
    }
  }

  return {
    played: won + drawn + lost,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    points: won * 3 + drawn,
    goalDiff: goalsFor - goalsAgainst,
    form,
    lastMatch,
    groupName: team?.group_name?.toUpperCase() ?? groupInfo?.groupName ?? null,
    groupPosition: groupInfo?.position ?? null,
  }
}

export function buildHeadToHeadSummary(
  homeTeamId: string,
  awayTeamId: string,
  allMatches: Match[],
  options?: { beforeMatch?: Match; excludeMatchId?: string; limit?: number },
): HeadToHeadSummary | null {
  const beforeTime = options?.beforeMatch ? matchSortTime(options.beforeMatch) : Number.POSITIVE_INFINITY
  const limit = options?.limit ?? 3

  const allHeadToHead = allMatches
    .filter((match) => {
      if (match.id === options?.excludeMatchId) return false
      if (match.status !== 'finished') return false
      if (!match.home_team_id || !match.away_team_id) return false

      const isHeadToHead =
        (match.home_team_id === homeTeamId && match.away_team_id === awayTeamId) ||
        (match.home_team_id === awayTeamId && match.away_team_id === homeTeamId)

      if (!isHeadToHead) return false
      return matchSortTime(match) < beforeTime
    })
    .sort((a, b) => matchSortTime(b) - matchSortTime(a))

  if (!allHeadToHead.length) return null

  const recent = allHeadToHead.slice(0, limit).map((match) => ({
    match,
    homeScore: match.home_score,
    awayScore: match.away_score,
  }))

  let homeWins = 0
  let draws = 0
  let awayWins = 0

  for (const match of allHeadToHead) {
    const winner = actualMatchWinner(match)
    if (!winner) continue

    if (winner === 'draw') {
      draws++
      continue
    }

    const homeTeamWon =
      (winner === 'home' && match.home_team_id === homeTeamId) ||
      (winner === 'away' && match.away_team_id === homeTeamId)

    if (homeTeamWon) homeWins++
    else awayWins++
  }

  return { homeWins, draws, awayWins, recent }
}

export function buildMatchContext(match: Match, allMatches: Match[]): MatchContext | null {
  if (!match.home_team_id || !match.away_team_id) return null

  return {
    home: buildTeamMatchContext(match.home_team_id, match.home_team, allMatches, {
      beforeMatch: match,
      excludeMatchId: match.id,
    }),
    away: buildTeamMatchContext(match.away_team_id, match.away_team, allMatches, {
      beforeMatch: match,
      excludeMatchId: match.id,
    }),
    headToHead: buildHeadToHeadSummary(match.home_team_id, match.away_team_id, allMatches, {
      beforeMatch: match,
      excludeMatchId: match.id,
    }),
  }
}

export function formResultLabel(result: TeamFormResult): string {
  if (result === 'W') return 'G'
  if (result === 'D') return 'E'
  return 'P'
}

export function formResultTitle(result: TeamFormResult): string {
  if (result === 'W') return 'Victoria'
  if (result === 'D') return 'Empate'
  return 'Derrota'
}

export function formatTeamLastMatch(lastMatch: TeamLastMatch): string {
  const opponentCode =
    lastMatch.opponent?.code ??
    (lastMatch.opponent ? lastMatch.opponent.name.slice(0, 3).toUpperCase() : '???')
  const venue = lastMatch.isHome ? 'vs' : '@'
  return `${lastMatch.teamScore}-${lastMatch.opponentScore} ${venue} ${opponentCode}`
}
