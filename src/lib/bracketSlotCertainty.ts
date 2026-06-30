import { getAnnexCAssignments } from '@/lib/fifaAnnexC'
import {
  computeGroupStandings,
  countFinishedMatchesInGroup,
  MATCHES_PER_GROUP,
  allGroupLetters,
} from '@/lib/groupStandings'
import { hasPenaltyShootout, matchKnockoutWinnerSide } from '@/lib/matchScoreDisplay'
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

function isQualifyingThirdSetLocked(standings: GroupStandings[], matches: Match[]): boolean {
  const thirds = rankedThirdPlaces(standings)
  const eighth = thirds[7]
  if (!eighth) return false

  for (const groupName of allGroupLetters()) {
    if (isGroupFinished(groupName, standings, matches)) continue
    const group = groupStandingsFor(standings, groupName)
    const third = rowAtPosition(group, 3)
    if (!third) continue
    if (maxPossiblePoints(third, groupName, matches) > eighth.points) return false
    if (
      maxPossiblePoints(third, groupName, matches) === eighth.points &&
      (third.goalDiff > eighth.goalDiff ||
        (third.goalDiff === eighth.goalDiff && third.goalsFor >= eighth.goalsFor))
    ) {
      return false
    }
  }
  return true
}

function isThirdSlotConfirmed(
  slot: Extract<BracketSlot, { type: 'best_third' }>,
  opponentSlot: BracketSlot | undefined,
  standings: GroupStandings[],
  matches: Match[],
): boolean {
  const winnerGroup = opponentWinnerGroup(opponentSlot)
  if (!winnerGroup) return false

  const qualifying = qualifyingThirdGroupLetters(standings)
  const assignments = getAnnexCAssignments(qualifying)
  const assignedGroup = assignments?.[winnerGroup]?.toUpperCase() ?? null
  if (!assignedGroup || !qualifying.includes(assignedGroup)) return false
  if (!isGroupFinished(assignedGroup, standings, matches)) return false
  if (!isQualifyingThirdSetLocked(standings, matches)) return false

  return slot.groups.map((g) => g.toUpperCase()).includes(assignedGroup)
}

function opponentWinnerGroup(opponentSlot: BracketSlot | undefined): string | null {
  if (opponentSlot?.type === 'group_pos' && opponentSlot.pos === 1) {
    return opponentSlot.group.toUpperCase()
  }
  return null
}

export const UNDEFINED_OPPONENT_LABEL = 'A definir'

/** Etiqueta pública: confirmado o provisional según Anexo C / tabla en vivo; "A definir" solo si sigue en disputa. */
export function publicBracketSideLabel(
  side: SlotSideAnalysis,
  _slot?: BracketSlot,
): string {
  if (side.status === 'pending') return UNDEFINED_OPPONENT_LABEL
  return side.displayName
}

/** Equipo resuelto para bandera/UI (Anexo C + tabla en vivo; no el TBD obsoleto de la BD). */
export function bracketSideTeam(
  match: Match,
  side: 'home' | 'away',
  teams: Team[],
  allMatches: Match[],
): Team | null {
  if (!isKnockoutBracketMatch(match) || !teams.length) {
    return side === 'home' ? match.home_team ?? null : match.away_team ?? null
  }
  const analysis = analyzeMatchBracket(match, teams, allMatches)
  const slotAnalysis = side === 'home' ? analysis.home : analysis.away
  return slotAnalysis.team ?? (side === 'home' ? match.home_team ?? null : match.away_team ?? null)
}

export function bracketSideFlagUrl(
  match: Match,
  side: 'home' | 'away',
  teams: Team[],
  allMatches: Match[],
): string | null {
  return bracketSideTeam(match, side, teams, allMatches)?.flag_url ?? null
}

export function isBracketSideProvisional(
  match: Match,
  side: 'home' | 'away',
  teams: Team[],
  allMatches: Match[],
): boolean {
  if (!isKnockoutBracketMatch(match) || !teams.length) {
    return !(side === 'home' ? match.home_team : match.away_team)
  }
  const analysis = analyzeMatchBracket(match, teams, allMatches)
  const slotAnalysis = side === 'home' ? analysis.home : analysis.away
  return slotAnalysis.status !== 'confirmed'
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
  const thirdLocked = isThirdSlotConfirmed(slot, opponentSlot, standings, matches)

  if (thirdLocked && assignedRow) {
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
      ? `Candidato: ${teamDisplayName(assignedRow.team)} (3º Gr. ${assignedGroup}, Anexo C provisional)`
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

function bracketSlotMatchNumber(matchNumber: number | string | undefined): number | null {
  if (matchNumber == null) return null
  const n = typeof matchNumber === 'number' ? matchNumber : Number.parseInt(String(matchNumber), 10)
  return Number.isFinite(n) ? n : null
}

function findBracketSourceMatch(allMatches: Match[], matchNumber: number | string): Match | undefined {
  const num = bracketSlotMatchNumber(matchNumber)
  if (num == null) return undefined
  return allMatches.find(
    (m) => m.bracket_meta?.match_number === num || m.bracket_key === `M${num}`,
  )
}

function teamOnMatchSide(match: Match, side: 'home' | 'away', teams: Team[]): Team | null {
  const linked = side === 'home' ? match.home_team : match.away_team
  if (linked) return linked
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id
  if (!teamId) return null
  return teams.find((t) => t.id === teamId) ?? null
}

function knockoutWinnerTeam(source: Match, teams: Team[]): Team | null {
  const side = matchKnockoutWinnerSide(source)
  if (!side) return null
  return teamOnMatchSide(source, side, teams)
}

function analyzeWinnerSlot(
  slot: Extract<BracketSlot, { type: 'winner' }>,
  allMatches: Match[],
  teams: Team[],
): SlotSideAnalysis {
  const source = findBracketSourceMatch(allMatches, slot.match)
  const slotLabel = `Ganador M${slot.match}`

  if (source?.status === 'finished') {
    const winner = knockoutWinnerTeam(source, teams)
    const homeTeam = teamOnMatchSide(source, 'home', teams)
    const awayTeam = teamOnMatchSide(source, 'away', teams)

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

    if (
      source.home_score === source.away_score &&
      !hasPenaltyShootout(source)
    ) {
      return {
        status: 'provisional',
        displayName: slotLabel,
        team: null,
        slotLabel,
        possibleTeams: [homeTeam, awayTeam].filter(Boolean) as Team[],
        detail: 'Empate: faltan penales en el sistema',
      }
    }
  }

  if (source?.home_team_id && source?.away_team_id) {
    const homeTeam = teamOnMatchSide(source, 'home', teams)
    const awayTeam = teamOnMatchSide(source, 'away', teams)
    return {
      status: 'provisional',
      displayName: slotLabel,
      team: null,
      slotLabel,
      possibleTeams: [homeTeam, awayTeam].filter(Boolean) as Team[],
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
  teams: Team[],
): SlotSideAnalysis {
  const source = findBracketSourceMatch(allMatches, slot.match)
  const slotLabel = `Perdedor M${slot.match}`

  if (source?.status === 'finished') {
    const winnerSide = matchKnockoutWinnerSide(source)
    const loser =
      winnerSide === 'home'
        ? teamOnMatchSide(source, 'away', teams)
        : winnerSide === 'away'
          ? teamOnMatchSide(source, 'home', teams)
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
    const homeTeam = teamOnMatchSide(source, 'home', teams)
    const awayTeam = teamOnMatchSide(source, 'away', teams)
    return {
      status: 'provisional',
      displayName: slotLabel,
      team: null,
      slotLabel,
      possibleTeams: [homeTeam, awayTeam].filter(Boolean) as Team[],
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
  teams: Team[],
): SlotSideAnalysis {
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

  if (slot.type === 'winner') {
    const resolved = analyzeWinnerSlot(slot, allMatches, teams)
    if (resolved.status === 'confirmed') return resolved
    if (
      assignedTeam &&
      findBracketSourceMatch(allMatches, slot.match)?.status === 'finished'
    ) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(assignedTeam),
        team: assignedTeam,
        slotLabel: `Ganador M${slot.match}`,
        possibleTeams: [assignedTeam],
        detail: 'Confirmado',
      }
    }
    return resolved
  }

  if (slot.type === 'loser') {
    const resolved = analyzeLoserSlot(slot, allMatches, teams)
    if (resolved.status === 'confirmed') return resolved
    if (
      assignedTeam &&
      findBracketSourceMatch(allMatches, slot.match)?.status === 'finished'
    ) {
      return {
        status: 'confirmed',
        displayName: teamDisplayName(assignedTeam),
        team: assignedTeam,
        slotLabel: `Perdedor M${slot.match}`,
        possibleTeams: [assignedTeam],
        detail: 'Confirmado',
      }
    }
    return resolved
  }

  if (slot.type === 'group_pos') {
    return analyzeGroupPosSlot(slot, standings, matches)
  }

  if (slot.type === 'best_third') {
    return analyzeBestThirdSlot(slot, opponentSlot, standings, matches)
  }

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
    teams,
  )
  const away = analyzeSlot(
    meta?.away,
    meta?.home,
    standings,
    allMatches.filter((m) => m.phase === 'group'),
    allMatches,
    match.away_team,
    teams,
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
