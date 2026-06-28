import { getAnnexCAssignments, thirdPlaceCombinationKey } from '@/lib/fifaAnnexC'
import {
  computeGroupStandings,
  countFinishedMatchesInGroup,
  MATCHES_PER_GROUP,
} from '@/lib/groupStandings'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { BracketSlot, GroupStandingRow, GroupStandings, Match, Team } from '@/types'

export type SlotCertaintyStatus = 'confirmed' | 'provisional' | 'pending'

export interface RankedThirdPlace {
  team: Team
  groupName: string
  points: number
  goalDiff: number
  goalsFor: number
  rank: number
}

export interface SlotSideAnalysis {
  status: SlotCertaintyStatus
  displayName: string
  team: Team | null
  slotLabel: string
  possibleTeams: Team[]
  detail: string | null
}

export type MatchCertaintyLevel = 'confirmed' | 'provisional' | 'partial' | 'pending'

export interface MatchBracketAnalysis {
  level: MatchCertaintyLevel
  levelLabel: string
  home: SlotSideAnalysis
  away: SlotSideAnalysis
}

function groupStandingsFor(standings: GroupStandings[], group: string): GroupStandings | undefined {
  return standings.find((g) => g.groupName === group.toUpperCase())
}

function rowAtPosition(group: GroupStandings | undefined, pos: number): GroupStandingRow | null {
  return group?.rows.find((r) => r.position === pos) ?? null
}

export function isGroupFinished(
  groupName: string,
  standings: GroupStandings[],
  matches: Match[],
): boolean {
  const group = groupStandingsFor(standings, groupName)
  if (!group) return false
  return countFinishedMatchesInGroup(group, matches) >= MATCHES_PER_GROUP
}

function remainingGroupMatchesForTeam(teamId: string, groupName: string, matches: Match[]): number {
  const group = groupName.toUpperCase()
  return matches.filter(
    (m) =>
      m.phase === 'group' &&
      m.status === 'scheduled' &&
      m.home_team_id &&
      m.away_team_id &&
      (m.home_team_id === teamId || m.away_team_id === teamId) &&
      [m.home_team, m.away_team].every((t) => t?.group_name?.toUpperCase() === group),
  ).length
}

function maxPossiblePoints(row: GroupStandingRow, groupName: string, matches: Match[]): number {
  return row.points + remainingGroupMatchesForTeam(row.team.id, groupName, matches) * 3
}

/** Equipos que aún pueden alcanzar el puesto indicado (por puntos). */
export function contendersForGroupPosition(
  groupName: string,
  position: number,
  standings: GroupStandings[],
  matches: Match[],
): Team[] {
  const group = groupStandingsFor(standings, groupName)
  if (!group) return []

  if (isGroupFinished(groupName, standings, matches)) {
    const holder = rowAtPosition(group, position)
    return holder ? [holder.team] : []
  }

  const holder = rowAtPosition(group, position)
  if (!holder) return group.rows.map((r) => r.team)

  const holderMinPoints = holder.points
  const contenders: Team[] = []

  for (const row of group.rows) {
    if (row.position <= position) {
      contenders.push(row.team)
      continue
    }
    if (maxPossiblePoints(row, groupName, matches) >= holderMinPoints) {
      contenders.push(row.team)
    }
  }

  return contenders
}

export function rankedThirdPlaces(standings: GroupStandings[]): RankedThirdPlace[] {
  const thirds: Omit<RankedThirdPlace, 'rank'>[] = []

  for (const group of standings) {
    const third = rowAtPosition(group, 3)
    if (!third) continue
    thirds.push({
      team: third.team,
      groupName: group.groupName,
      points: third.points,
      goalDiff: third.goalDiff,
      goalsFor: third.goalsFor,
    })
  }

  return thirds
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.groupName.localeCompare(b.groupName)
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export function qualifyingThirdGroupLetters(standings: GroupStandings[]): string[] {
  return rankedThirdPlaces(standings)
    .filter((t) => t.rank <= 8)
    .map((t) => t.groupName)
}

function slotOrdinal(pos: number): string {
  if (pos === 1) return '1º'
  if (pos === 2) return '2º'
  return '3º'
}

function analyzeGroupPosSlot(
  slot: Extract<BracketSlot, { type: 'group_pos' }>,
  standings: GroupStandings[],
  matches: Match[],
): SlotSideAnalysis {
  const groupName = slot.group.toUpperCase()
  const group = groupStandingsFor(standings, groupName)
  const row = rowAtPosition(group, slot.pos)
  const finished = isGroupFinished(groupName, standings, matches)
  const possibleTeams = contendersForGroupPosition(groupName, slot.pos, standings, matches)
  const slotLabel = `${slotOrdinal(slot.pos)} Gr. ${groupName}`

  if (!row) {
    return {
      status: 'pending',
      displayName: slotLabel,
      team: null,
      slotLabel,
      possibleTeams: [],
      detail: 'Grupo sin datos',
    }
  }

  if (finished) {
    return {
      status: 'confirmed',
      displayName: teamDisplayName(row.team),
      team: row.team,
      slotLabel,
      possibleTeams: [row.team],
      detail: 'Clasificación confirmada',
    }
  }

  const detail =
    possibleTeams.length > 1
      ? `${possibleTeams.length} equipos aún pueden ocupar este puesto`
      : 'Provisional según tabla en vivo'

  return {
    status: 'provisional',
    displayName: teamDisplayName(row.team),
    team: row.team,
    slotLabel,
    possibleTeams,
    detail,
  }
}

function opponentWinnerGroup(opponentSlot: BracketSlot | undefined): string | null {
  if (opponentSlot?.type === 'group_pos' && opponentSlot.pos === 1) {
    return opponentSlot.group.toUpperCase()
  }
  return null
}

function analyzeBestThirdSlot(
  slot: Extract<BracketSlot, { type: 'best_third' }>,
  opponentSlot: BracketSlot | undefined,
  standings: GroupStandings[],
  matches: Match[],
): SlotSideAnalysis {
  const eligible = slot.groups.map((g) => g.toUpperCase())
  const winnerGroup = opponentWinnerGroup(opponentSlot)
  const slotLabel = winnerGroup
    ? `Mejor 3º vs 1º ${winnerGroup} (Anexo C)`
    : 'Mejor 3º (Anexo C FIFA)'

  const poolThirds = rankedThirdPlaces(standings).filter((t) => eligible.includes(t.groupName))
  const possibleTeams = poolThirds.map((t) => t.team)

  if (!winnerGroup) {
    return {
      status: 'pending',
      displayName: 'Mejor 3º por definir',
      team: null,
      slotLabel,
      possibleTeams,
      detail: 'Esperando rival ganador de grupo',
    }
  }

  const qualifying = qualifyingThirdGroupLetters(standings)
  const assignments = getAnnexCAssignments(qualifying)
  const assignedGroup = assignments?.[winnerGroup]?.toUpperCase() ?? null
  const assignedRow = assignedGroup ? rowAtPosition(groupStandingsFor(standings, assignedGroup), 3) : null

  const allGroupsDone = qualifying.every((g) => isGroupFinished(g, standings, matches))
  const assignedGroupDone = assignedGroup
    ? isGroupFinished(assignedGroup, standings, matches)
    : false

  if (allGroupsDone && assignedGroupDone && assignedRow) {
    return {
      status: 'confirmed',
      displayName: teamDisplayName(assignedRow.team),
      team: assignedRow.team,
      slotLabel: `3º Gr. ${assignedGroup}`,
      possibleTeams: [assignedRow.team],
      detail: 'Rival confirmado (Anexo C)',
    }
  }

  if (assignedRow && assignedGroup) {
    const inTopEight = qualifying.includes(assignedGroup)
    const detail = inTopEight
      ? `Provisional: 3º Gr. ${assignedGroup} (Anexo C con ${thirdPlaceCombinationKey(qualifying)})`
      : `Gr. ${assignedGroup} fuera del top 8 actual — el rival puede cambiar`

    return {
      status: 'provisional',
      displayName: teamDisplayName(assignedRow.team),
      team: assignedRow.team,
      slotLabel: `3º Gr. ${assignedGroup}`,
      possibleTeams,
      detail,
    }
  }

  return {
    status: 'pending',
    displayName: 'Mejor 3º por definir',
    team: null,
    slotLabel,
    possibleTeams,
    detail: `Posibles 3º de grupos ${eligible.join(', ')}`,
  }
}

function analyzeWinnerSlot(
  slot: Extract<BracketSlot, { type: 'winner' }>,
  allMatches: Match[],
): SlotSideAnalysis {
  const source = allMatches.find((m) => m.bracket_meta?.match_number === slot.match)
  const slotLabel = `Ganador M${slot.match}`

  if (source?.status === 'finished') {
    const winner =
      source.home_score > source.away_score
        ? source.home_team
        : source.away_score > source.home_score
          ? source.away_team
          : null

    if (winner) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(winner),
        team: winner,
        slotLabel,
        possibleTeams: [winner],
        detail: 'Ganador confirmado',
      }
    }
  }

  if (source?.home_team_id && source?.away_team_id) {
    return {
      status: 'provisional',
      displayName: slotLabel,
      team: null,
      slotLabel,
      possibleTeams: [source.home_team, source.away_team].filter(Boolean) as Team[],
      detail: 'Partido anterior sin definir',
    }
  }

  return {
    status: 'pending',
    displayName: slotLabel,
    team: null,
    slotLabel,
    possibleTeams: [],
    detail: 'Esperando cruces anteriores',
  }
}

function analyzeLoserSlot(
  slot: Extract<BracketSlot, { type: 'loser' }>,
  allMatches: Match[],
): SlotSideAnalysis {
  const source = allMatches.find((m) => m.bracket_meta?.match_number === slot.match)
  const slotLabel = `Perdedor M${slot.match}`

  if (source?.status === 'finished') {
    const loser =
      source.home_score > source.away_score
        ? source.away_team
        : source.away_score > source.home_score
          ? source.home_team
          : null

    if (loser) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(loser),
        team: loser,
        slotLabel,
        possibleTeams: [loser],
        detail: 'Perdedor confirmado',
      }
    }
  }

  if (source?.home_team_id && source?.away_team_id) {
    return {
      status: 'provisional',
      displayName: slotLabel,
      team: null,
      slotLabel,
      possibleTeams: [source.home_team, source.away_team].filter(Boolean) as Team[],
      detail: 'Esperando semifinal',
    }
  }

  return {
    status: 'pending',
    displayName: slotLabel,
    team: null,
    slotLabel,
    possibleTeams: [],
    detail: 'Esperando semifinales',
  }
}

function analyzeSlot(
  slot: BracketSlot | undefined,
  opponentSlot: BracketSlot | undefined,
  standings: GroupStandings[],
  matches: Match[],
  allMatches: Match[],
  assignedTeam: Team | null | undefined,
): SlotSideAnalysis {
  if (assignedTeam && slot?.type === 'group_pos') {
    const finished = isGroupFinished(slot.group, standings, matches)
    if (finished) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(assignedTeam),
        team: assignedTeam,
        slotLabel: `${slotOrdinal(slot.pos)} Gr. ${slot.group.toUpperCase()}`,
        possibleTeams: [assignedTeam],
        detail: 'Clasificación confirmada',
      }
    }
  }

  if (assignedTeam && slot?.type === 'best_third') {
    const winnerGroup = opponentWinnerGroup(opponentSlot)
    const qualifying = qualifyingThirdGroupLetters(standings)
    const allDone = qualifying.every((g) => isGroupFinished(g, standings, matches))
    if (allDone && assignedTeam.group_name) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(assignedTeam),
        team: assignedTeam,
        slotLabel: `3º Gr. ${assignedTeam.group_name.toUpperCase()}`,
        possibleTeams: [assignedTeam],
        detail: 'Rival confirmado (Anexo C)',
      }
    }
  }

  if (assignedTeam && (slot?.type === 'winner' || slot?.type === 'loser')) {
    const sourceFinished =
      slot.type === 'winner' || slot.type === 'loser'
        ? allMatches.find((m) => m.bracket_meta?.match_number === slot.match)?.status === 'finished'
        : false
    if (sourceFinished) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(assignedTeam),
        team: assignedTeam,
        slotLabel: slot.type === 'winner' ? `Ganador M${slot.match}` : `Perdedor M${slot.match}`,
        possibleTeams: [assignedTeam],
        detail: 'Confirmado',
      }
    }
  }

  if (!slot) {
    return {
      status: assignedTeam ? 'provisional' : 'pending',
      displayName: assignedTeam ? teamDisplayName(assignedTeam) : 'Por definir',
      team: assignedTeam ?? null,
      slotLabel: 'Por definir',
      possibleTeams: assignedTeam ? [assignedTeam] : [],
      detail: null,
    }
  }

  if (slot.type === 'group_pos') {
    const analysis = analyzeGroupPosSlot(slot, standings, matches)
    if (assignedTeam && analysis.status === 'provisional') {
      return { ...analysis, team: assignedTeam, displayName: teamDisplayName(assignedTeam) }
    }
    return analysis
  }

  if (slot.type === 'best_third') {
    const analysis = analyzeBestThirdSlot(slot, opponentSlot, standings, matches)
    if (assignedTeam && analysis.status !== 'confirmed') {
      return { ...analysis, team: assignedTeam, displayName: teamDisplayName(assignedTeam) }
    }
    return analysis
  }

  if (slot.type === 'winner') return analyzeWinnerSlot(slot, allMatches)
  if (slot.type === 'loser') return analyzeLoserSlot(slot, allMatches)

  return {
    status: 'pending',
    displayName: 'Por definir',
    team: null,
    slotLabel: 'Por definir',
    possibleTeams: [],
    detail: null,
  }
}

function matchLevelLabel(level: MatchCertaintyLevel): string {
  switch (level) {
    case 'confirmed':
      return 'Definido al 100%'
    case 'provisional':
      return 'Provisional (puede cambiar)'
    case 'partial':
      return 'Parcialmente definido'
    default:
      return 'En disputa'
  }
}

function computeMatchLevel(home: SlotSideAnalysis, away: SlotSideAnalysis): MatchCertaintyLevel {
  if (home.status === 'confirmed' && away.status === 'confirmed') return 'confirmed'
  if (home.status === 'pending' && away.status === 'pending') return 'pending'
  if (
    (home.status === 'confirmed' && away.status !== 'confirmed') ||
    (away.status === 'confirmed' && home.status !== 'confirmed')
  ) {
    return 'partial'
  }
  return 'provisional'
}

export function analyzeMatchBracket(
  match: Match,
  teams: Team[],
  allMatches: Match[],
): MatchBracketAnalysis {
  const groupMatches = allMatches.filter(
    (m) => m.phase === 'group' && (m.status === 'finished' || m.status === 'live'),
  )
  const standings = computeGroupStandings(teams, groupMatches)
  const meta = match.bracket_meta

  const home = analyzeSlot(
    meta?.home,
    meta?.away,
    standings,
    allMatches.filter((m) => m.phase === 'group'),
    allMatches,
    match.home_team,
  )
  const away = analyzeSlot(
    meta?.away,
    meta?.home,
    standings,
    allMatches.filter((m) => m.phase === 'group'),
    allMatches,
    match.away_team,
  )

  const level = computeMatchLevel(home, away)

  return {
    level,
    levelLabel: matchLevelLabel(level),
    home,
    away,
  }
}

export function isKnockoutBracketMatch(match: Match): boolean {
  return Boolean(match.phase && match.phase !== 'group' && match.bracket_meta)
}
