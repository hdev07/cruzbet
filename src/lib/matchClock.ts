import type { Match } from '@/types'

export function formatMatchClock(
  match: Pick<Match, 'current_minute' | 'live_clock_display' | 'status'>,
): string {
  if (match.live_clock_display === 'HT') return 'Entretiempo'
  if (match.live_clock_display) return match.live_clock_display

  if (match.status === 'live' && match.current_minute != null && match.current_minute > 0) {
    return `${match.current_minute}'`
  }

  return ''
}

export function formatLiveStatusLabel(
  match: Pick<Match, 'current_minute' | 'live_clock_display' | 'status'>,
): string {
  if (match.live_clock_display === 'HT') return 'ENTRETIEMPO'
  const clock = formatMatchClock(match)
  return clock ? `EN VIVO · ${clock}` : 'EN VIVO'
}
