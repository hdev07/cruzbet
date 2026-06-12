import type { GroupStandingRow, GroupStandings, Match, Team } from '@/types'

const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('')

interface TeamStats {
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
}

function emptyStats(): TeamStats {
  return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
}

function toRow(team: Team, stats: TeamStats, position: number): GroupStandingRow {
  return {
    team,
    position,
    played: stats.played,
    won: stats.won,
    drawn: stats.drawn,
    lost: stats.lost,
    goalsFor: stats.goalsFor,
    goalsAgainst: stats.goalsAgainst,
    goalDiff: stats.goalsFor - stats.goalsAgainst,
    points: stats.won * 3 + stats.drawn,
  }
}

function compareRows(a: GroupStandingRow, b: GroupStandingRow): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return a.team.name.localeCompare(b.team.name, 'es')
}

export function computeGroupStandings(teams: Team[], matches: Match[]): GroupStandings[] {
  const teamsByGroup = new Map<string, Team[]>()

  for (const team of teams) {
    if (!team.group_name) continue
    const group = team.group_name.toUpperCase()
    const list = teamsByGroup.get(group) ?? []
    list.push(team)
    teamsByGroup.set(group, list)
  }

  const finishedGroupMatches = matches.filter(
    (m) => m.phase === 'group' && m.status === 'finished',
  )

  const standings: GroupStandings[] = []

  for (const groupName of GROUP_LETTERS) {
    const groupTeams = teamsByGroup.get(groupName) ?? []
    if (!groupTeams.length) continue

    const statsMap = new Map<string, TeamStats>()
    for (const team of groupTeams) {
      statsMap.set(team.id, emptyStats())
    }

    const teamIds = new Set(groupTeams.map((t) => t.id))

    for (const match of finishedGroupMatches) {
      if (!teamIds.has(match.home_team_id) || !teamIds.has(match.away_team_id)) continue

      const home = statsMap.get(match.home_team_id)!
      const away = statsMap.get(match.away_team_id)!
      const hs = match.home_score
      const as = match.away_score

      home.played++
      away.played++
      home.goalsFor += hs
      home.goalsAgainst += as
      away.goalsFor += as
      away.goalsAgainst += hs

      if (hs > as) {
        home.won++
        away.lost++
      } else if (hs < as) {
        away.won++
        home.lost++
      } else {
        home.drawn++
        away.drawn++
      }
    }

    const rows = groupTeams
      .map((team) => toRow(team, statsMap.get(team.id)!, 0))
      .sort(compareRows)
      .map((row, index) => ({ ...row, position: index + 1 }))

    standings.push({ groupName, rows })
  }

  return standings
}

export function allGroupLetters(): string[] {
  return [...GROUP_LETTERS]
}
