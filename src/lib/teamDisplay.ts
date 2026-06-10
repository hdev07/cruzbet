import { TEAM_NAMES_ES } from '@/constants/team-names-es'
import type { Team } from '@/types'

type TeamLike = Pick<Team, 'code' | 'name'> | null | undefined

export function teamNameFromCode(code: string | null | undefined): string | null {
  if (!code) return null
  return TEAM_NAMES_ES[code.toUpperCase()] ?? null
}

/** Nombre en español a partir del código FIFA; si no hay entrada, usa el nombre del equipo o el fallback. */
export function teamDisplayName(team: TeamLike, fallback = 'Equipo'): string {
  if (!team) return fallback
  const fromCode = teamNameFromCode(team.code)
  if (fromCode) return fromCode
  return team.name || fallback
}

export function matchTeamsLabel(
  match: { home_team?: TeamLike; away_team?: TeamLike } | null | undefined,
  separator = ' vs ',
): string {
  if (!match) return ''
  return `${teamDisplayName(match.home_team, 'Local')}${separator}${teamDisplayName(match.away_team, 'Visitante')}`
}
