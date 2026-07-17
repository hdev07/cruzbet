import { TEAM_NAMES_ES } from '@/constants/team-names-es'
import type { Team } from '@/types'

type TeamLike = Pick<Team, 'code' | 'name'> | null | undefined

const CREST_BY_CODE: Record<string, string> = {
  AME: '/teams/ame.png',
  ATN: '/teams/atn.png',
  ATS: '/teams/ats.png',
  ASL: '/teams/asl.png',
  TIJ: '/teams/tij.png',
  CAZ: '/teams/caz.png',
  JUA: '/teams/jua.png',
  QRO: '/teams/qro.png',
  GDL: '/teams/gdl.png',
  LEO: '/teams/leo.png',
  NEC: '/teams/nec.png',
  PAC: '/teams/pac.png',
  PUE: '/teams/pue.png',
  MTY: '/teams/mty.png',
  SAN: '/teams/san.png',
  TIG: '/teams/tig.png',
  TOL: '/teams/tol.png',
  PUM: '/teams/pum.png',
}

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

/** Escudo local por código de club (`AME` → `/teams/ame.png`). */
export function teamCrestUrl(code: string | null | undefined): string | null {
  if (!code) return null
  return CREST_BY_CODE[code.toUpperCase()] ?? `/teams/${code.toLowerCase()}.png`
}

/** Usa escudo local por código si existe; si no, `flag_url` externo. */
export function resolveTeamCrest(
  team: (Pick<Team, 'code' | 'flag_url'> | null | undefined),
): string | null {
  if (!team) return null
  const local = teamCrestUrl(team.code)
  if (local && CREST_BY_CODE[team.code?.toUpperCase() ?? '']) return local
  if (team.flag_url) return team.flag_url
  return local
}
