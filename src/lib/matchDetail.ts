import { supabase } from '@/lib/supabase'
import type { Competition, Match } from '@/types'

const MATCH_SELECT =
  '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), competition:competitions(id, slug, name, season)'

export type MatchWithCompetition = Match & {
  competition: Pick<Competition, 'id' | 'slug' | 'name' | 'season'> | null
}

export async function fetchMatchById(matchId: string): Promise<MatchWithCompetition | null> {
  const { data } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('id', matchId)
    .maybeSingle()

  return (data as MatchWithCompetition | null) ?? null
}
