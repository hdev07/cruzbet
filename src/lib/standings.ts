import type { StandingRow } from '@/types/tablas'

export type StandingsMatchSource = {
  id: string
  status: string
  home_score: number
  away_score: number
  home_team_id: string
  away_team_id: string
}

export type StandingsTeamInfo = { code: string; name: string }

type TeamStats = {
  teamCode: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

function applyMatchResult(stats: TeamStats, goalsFor: number, goalsAgainst: number): void {
  stats.played += 1
  stats.goalsFor += goalsFor
  stats.goalsAgainst += goalsAgainst
  if (goalsFor > goalsAgainst) stats.won += 1
  else if (goalsFor < goalsAgainst) stats.lost += 1
  else stats.drawn += 1
}

/**
 * Tabla general: pts → DG → GF → nombre. Incluye partidos en vivo (provisional).
 *
 * `participants` fija el set inicial de filas (p. ej. `LIGA_MX_CLUBS` para
 * mostrar los 18 clubes aunque no hayan jugado). Si se omite, los equipos se
 * derivan de los propios `matches` recibidos — sirve tanto para una
 * competencia completa como para el subconjunto de partidos de un solo equipo.
 */
export function buildStandings(
  matches: StandingsMatchSource[],
  teamMap: Map<string, StandingsTeamInfo>,
  participants?: StandingsTeamInfo[],
): StandingRow[] {
  const byCode = new Map<string, TeamStats>()

  function ensure(team: StandingsTeamInfo): TeamStats {
    let stats = byCode.get(team.code)
    if (!stats) {
      stats = {
        teamCode: team.code,
        teamName: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      }
      byCode.set(team.code, stats)
    }
    return stats
  }

  for (const team of participants ?? []) ensure(team)

  for (const match of matches) {
    if (match.status !== 'finished' && match.status !== 'live') continue
    const home = teamMap.get(match.home_team_id)
    const away = teamMap.get(match.away_team_id)
    if (!home || !away) continue

    applyMatchResult(ensure(home), match.home_score, match.away_score)
    applyMatchResult(ensure(away), match.away_score, match.home_score)
  }

  return Array.from(byCode.values())
    .map((row) => ({
      ...row,
      goalDiff: row.goalsFor - row.goalsAgainst,
      points: row.won * 3 + row.drawn,
      position: 0,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName, 'es'),
    )
    .map((row, index) => ({ ...row, position: index + 1 }))
}
