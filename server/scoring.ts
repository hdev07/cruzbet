import { fetchFootballApi } from './football'
import { WORLD_CUP_LEAGUE_ID_STR, WORLD_CUP_SEASON_STR } from './football-config'
import { getSupabaseAdmin } from './supabase-admin'

interface GoalEvent {
  matchId: number
  minute: number
  team: 'home' | 'away'
}

interface ApiEvent {
  time: { elapsed: number | null }
  team: { id: number }
  type: string
}

interface ApiFixtureEvents {
  response: Array<{
    fixture: { id: number }
    events: ApiEvent[]
    teams: { home: { id: number }; away: { id: number } }
  }>
}

export function calculatePoints(
  predictedMinute: number,
  predictedTeam: 'home' | 'away',
  goalMinute: number,
  goalTeam: 'home' | 'away',
): number {
  if (predictedTeam !== goalTeam) return 0
  const diff = Math.abs(predictedMinute - goalMinute)
  if (diff === 0) return 50
  if (diff <= 1) return 25
  if (diff <= 3) return 10
  return 5
}

async function fetchGoalsForFixture(fixtureId: number): Promise<GoalEvent[]> {
  const data = (await fetchFootballApi('/fixtures/events', {
    fixture: String(fixtureId),
  })) as ApiFixtureEvents

  const entry = data.response?.[0]
  if (!entry) return []

  const homeId = entry.teams.home.id
  const goals: GoalEvent[] = []

  for (const event of entry.events ?? []) {
    if (event.type !== 'Goal' || event.time.elapsed == null) continue
    goals.push({
      matchId: fixtureId,
      minute: event.time.elapsed,
      team: event.team.id === homeId ? 'home' : 'away',
    })
  }

  return goals
}

async function getActiveWorldCupFixtures(): Promise<number[]> {
  const live = (await fetchFootballApi('/fixtures', {
    live: 'all',
    league: WORLD_CUP_LEAGUE_ID_STR,
    season: WORLD_CUP_SEASON_STR,
  })) as { response?: Array<{ fixture: { id: number } }> }

  const ids = (live.response ?? []).map((f) => f.fixture.id)

  if (ids.length > 0) return ids

  const recent = (await fetchFootballApi('/fixtures', {
    league: WORLD_CUP_LEAGUE_ID_STR,
    season: WORLD_CUP_SEASON_STR,
    last: '10',
  })) as { response?: Array<{ fixture: { id: number; status: { short: string } } }> }

  return (recent.response ?? [])
    .filter((f) => ['1H', '2H', 'HT', 'ET', 'FT', 'AET', 'PEN'].includes(f.fixture.status.short))
    .map((f) => f.fixture.id)
}

export async function processNewGoals(): Promise<{ goalsProcessed: number; predictionsScored: number }> {
  const supabase = getSupabaseAdmin()
  const fixtureIds = await getActiveWorldCupFixtures()

  let goalsProcessed = 0
  let predictionsScored = 0

  for (const fixtureId of fixtureIds) {
    const goals = await fetchGoalsForFixture(fixtureId)

    for (const goal of goals) {
      const { data: existing } = await supabase
        .from('match_goal_events')
        .select('id')
        .eq('match_id', goal.matchId)
        .eq('goal_minute', goal.minute)
        .eq('goal_team', goal.team)
        .maybeSingle()

      if (existing) continue

      const { error: insertError } = await supabase.from('match_goal_events').insert({
        match_id: goal.matchId,
        goal_minute: goal.minute,
        goal_team: goal.team,
      })

      if (insertError) continue
      goalsProcessed++

      const { data: predictions } = await supabase
        .from('predictions')
        .select('id, user_id, predicted_minute, predicted_team, points')
        .eq('match_id', goal.matchId)
        .is('scored_at', null)

      for (const pred of predictions ?? []) {
        const pts = calculatePoints(
          pred.predicted_minute,
          pred.predicted_team as 'home' | 'away',
          goal.minute,
          goal.team,
        )

        await supabase
          .from('predictions')
          .update({ points: pts, scored_at: new Date().toISOString() })
          .eq('id', pred.id)

        if (pts > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', pred.user_id)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({ points: profile.points + pts })
              .eq('id', pred.user_id)
          }
        }

        predictionsScored++
      }
    }
  }

  return { goalsProcessed, predictionsScored }
}
