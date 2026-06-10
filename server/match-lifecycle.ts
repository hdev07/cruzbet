import {
  estimateCurrentMinuteFromKickoff,
  getEffectiveMatchStatus,
  MATCH_TOTAL_DURATION_MIN,
} from '../src/lib/matchLifecycle'
import type { Match } from '../src/types'
import { getSupabaseAdmin } from './supabase-admin'

export async function syncMatchStatuses(): Promise<{
  promotedToLive: number
  promotedToFinished: number
  minutesUpdated: number
}> {
  const supabase = getSupabaseAdmin()
  const now = Date.now()

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, status, match_date, current_minute, home_score, away_score')
    .in('status', ['scheduled', 'live'])
    .not('match_date', 'is', null)

  if (error) throw error

  let promotedToLive = 0
  let promotedToFinished = 0
  let minutesUpdated = 0

  for (const row of matches ?? []) {
    const match = row as Match
    const effective = getEffectiveMatchStatus(match, now)
    if (effective === 'scheduled') continue

    if (effective === 'live' && match.status === 'scheduled') {
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'live',
          current_minute: estimateCurrentMinuteFromKickoff(match, now),
          home_score: 0,
          away_score: 0,
        })
        .eq('id', match.id)

      if (!updateError) promotedToLive++
      continue
    }

    if (effective === 'finished') {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'finished' })
        .eq('id', match.id)

      if (!updateError) promotedToFinished++
      continue
    }

    if (effective === 'live' && match.status === 'live') {
      const kickoff = new Date(match.match_date!).getTime()
      if (now - kickoff < MATCH_TOTAL_DURATION_MIN * 60_000) {
        const minute = Math.max(
          match.current_minute ?? 0,
          estimateCurrentMinuteFromKickoff(match, now),
        )
        if (minute !== match.current_minute) {
          const { error: updateError } = await supabase
            .from('matches')
            .update({ current_minute: minute })
            .eq('id', match.id)

          if (!updateError) minutesUpdated++
        }
      }
    }
  }

  return { promotedToLive, promotedToFinished, minutesUpdated }
}
