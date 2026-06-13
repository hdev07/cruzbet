import {
  MATCHES_PER_GROUP,
  allGroupLetters,
  computeGroupStandings,
  countFinishedMatchesInGroup,
} from '@/lib/groupStandings'
import { phaseLabel as getPhaseLabel } from '@/lib/matchPhases'
import type { BracketMeta, BracketSlot, Match, Team } from '@/types'

export interface BracketRound {
  phase: string
  label: string
  matches: Match[]
}

const ROUND_LABELS: Record<string, string> = {
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos de final',
  sf: 'Semifinales',
  third: 'Tercer lugar',
  final: 'Final',
}

const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'third', 'final'] as const

export function isGroupStageComplete(teams: Team[], matches: Match[]): boolean {
  const groupMatches = matches.filter((m) => m.phase === 'group')
  if (groupMatches.length < 72) return false
  if (groupMatches.some((m) => m.status !== 'finished')) return false

  const standings = computeGroupStandings(teams, matches)
  return allGroupLetters().every((letter) => {
    const group = standings.find((g) => g.groupName === letter)
    if (!group) return false
    return countFinishedMatchesInGroup(group, matches) >= MATCHES_PER_GROUP
  })
}

export function groupStageProgress(teams: Team[], matches: Match[]): { finished: number; total: number } {
  const groupMatches = matches.filter((m) => m.phase === 'group')
  return {
    finished: groupMatches.filter((m) => m.status === 'finished').length,
    total: 72,
  }
}

function slotLabel(slot: BracketSlot | undefined): string {
  if (!slot) return 'Por definir'
  if (slot.type === 'group_pos') {
    const ord = slot.pos === 1 ? '1º' : slot.pos === 2 ? '2º' : '3º'
    return `${ord} Grupo ${slot.group}`
  }
  if (slot.type === 'best_third') {
    return `Mejor 3º (${slot.groups?.join(', ') ?? '?'})`
  }
  if (slot.type === 'winner') return `Ganador M${slot.match}`
  if (slot.type === 'loser') return `Perdedor M${slot.match}`
  return 'Por definir'
}

export function bracketParticipantLabel(
  match: Match,
  side: 'home' | 'away',
): string {
  const team = side === 'home' ? match.home_team : match.away_team
  if (team) return team.name

  const meta = match.bracket_meta
  if (!meta) return 'Por definir'
  return slotLabel(side === 'home' ? meta.home : meta.away)
}

export function buildKnockoutRounds(matches: Match[]): BracketRound[] {
  const knockout = matches
    .filter((m) => m.phase && ROUND_ORDER.includes(m.phase as (typeof ROUND_ORDER)[number]))
    .sort((a, b) => {
      const phaseDiff =
        ROUND_ORDER.indexOf(a.phase as (typeof ROUND_ORDER)[number]) -
        ROUND_ORDER.indexOf(b.phase as (typeof ROUND_ORDER)[number])
      if (phaseDiff !== 0) return phaseDiff
      const aNum = a.bracket_meta?.match_number ?? 0
      const bNum = b.bracket_meta?.match_number ?? 0
      return aNum - bNum
    })

  return ROUND_ORDER.map((phase) => ({
    phase,
    label: ROUND_LABELS[phase] ?? phase,
    matches: knockout.filter((m) => m.phase === phase),
  })).filter((round) => round.matches.length > 0)
}

export function matchBracketLabel(match: Match): string {
  return match.bracket_meta?.label ?? match.bracket_key ?? getPhaseLabel(match.phase)
}

export function isKnockoutFilled(matches: Match[]): boolean {
  const r32 = matches.filter((m) => m.phase === 'r32')
  if (!r32.length) return false
  return r32.every((m) => m.home_team_id && m.away_team_id)
}

export type { BracketMeta, BracketSlot }
