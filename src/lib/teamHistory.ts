import { supabase } from '@/lib/supabase'
import { teamCrestUrl, teamDisplayName } from '@/lib/teamDisplay'
import type { Competition, Match } from '@/types'

const MATCH_SELECT =
  '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), competition:competitions(id, slug, name, season)'

type MatchWithCompetition = Match & {
  competition: Pick<Competition, 'id' | 'slug' | 'name' | 'season'> | null
}

export type TeamCompetitionSummary = {
  competitionId: string
  competitionSlug: string
  competitionName: string
  competitionSeason: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export type TeamHistory = {
  team: { id: string; code: string; name: string; crestUrl: string | null }
  byCompetition: TeamCompetitionSummary[]
  matches: Match[]
}

function summarizeTeamRecord(matches: MatchWithCompetition[], teamId: string) {
  let played = 0
  let won = 0
  let drawn = 0
  let lost = 0
  let goalsFor = 0
  let goalsAgainst = 0

  for (const match of matches) {
    if (match.status !== 'finished' && match.status !== 'live') continue
    const isHome = match.home_team_id === teamId
    const goalsForMatch = isHome ? match.home_score : match.away_score
    const goalsAgainstMatch = isHome ? match.away_score : match.home_score

    played += 1
    goalsFor += goalsForMatch
    goalsAgainst += goalsAgainstMatch
    if (goalsForMatch > goalsAgainstMatch) won += 1
    else if (goalsForMatch < goalsAgainstMatch) lost += 1
    else drawn += 1
  }

  return {
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    points: won * 3 + drawn,
  }
}

/**
 * Historial completo de un equipo (todas las competencias donde jugó) más un
 * resumen de resultados por torneo. `teams.id` se conserva entre torneos
 * (los seeds hacen upsert por `code`), así que un solo `home_team_id`/
 * `away_team_id` alcanza para juntar el histórico completo.
 */
export async function fetchTeamHistory(teamCode: string): Promise<TeamHistory | null> {
  const code = teamCode.toUpperCase()

  const { data: teamRow } = await supabase
    .from('teams')
    .select('id, code, name, flag_url')
    .eq('code', code)
    .maybeSingle()

  if (!teamRow) return null

  const { data } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .or(`home_team_id.eq.${teamRow.id},away_team_id.eq.${teamRow.id}`)
    .order('match_date', { ascending: true })

  const matches = (data ?? []) as unknown as MatchWithCompetition[]

  const byCompetitionId = new Map<string, MatchWithCompetition[]>()
  for (const match of matches) {
    const list = byCompetitionId.get(match.competition_id) ?? []
    list.push(match)
    byCompetitionId.set(match.competition_id, list)
  }

  const byCompetition: TeamCompetitionSummary[] = Array.from(byCompetitionId.entries())
    .map(([competitionId, competitionMatches]) => {
      const competition = competitionMatches[0]?.competition
      if (!competition) return null
      return {
        competitionId,
        competitionSlug: competition.slug,
        competitionName: competition.name,
        competitionSeason: competition.season,
        ...summarizeTeamRecord(competitionMatches, teamRow.id),
      }
    })
    .filter((row): row is TeamCompetitionSummary => row !== null)
    .sort((a, b) => b.competitionSeason.localeCompare(a.competitionSeason, 'es'))

  return {
    team: {
      id: teamRow.id,
      code: teamRow.code,
      name: teamDisplayName(teamRow, teamRow.name),
      crestUrl: teamCrestUrl(teamRow.code) ?? teamRow.flag_url,
    },
    byCompetition,
    matches,
  }
}
