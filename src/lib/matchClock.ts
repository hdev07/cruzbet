import type { Match } from '@/types'

/** Evita que un patch realtime retroceda el reloj (ej. 90+2 → 73). */
export function mergeLiveClockPatch(existing: Match, patch: Partial<Match>): Match {
  if (patch.live_clock_display === 'HT' || patch.live_clock_display === 'FT') {
    return { ...existing, ...patch }
  }

  const prevMin = existing.current_minute ?? 0
  const nextMin = patch.current_minute

  if (prevMin > 0 && nextMin != null && nextMin < prevMin) {
    return {
      ...existing,
      ...patch,
      current_minute: prevMin,
      live_clock_display: existing.live_clock_display ?? patch.live_clock_display ?? null,
    }
  }

  return { ...existing, ...patch }
}

export function formatMatchClock(
  match: Pick<Match, 'current_minute' | 'live_clock_display' | 'status'>,
): string {
  if (match.live_clock_display === 'HT') return 'Entretiempo'
  if (match.live_clock_display === 'FT') return 'FT'

  const totalMinute = match.current_minute ?? 0

  if (match.live_clock_display) {
    if (totalMinute > 90 && match.live_clock_display === "90'") {
      return `90+${totalMinute - 90}'`
    }
    return match.live_clock_display
  }

  if (match.status === 'live' && totalMinute > 0) {
    if (totalMinute > 90) return `90+${totalMinute - 90}'`
    return `${totalMinute}'`
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
