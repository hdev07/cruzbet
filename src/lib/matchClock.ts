import type { LiveStatusDetail, Match } from '@/types'

export const LIVE_STATUS_DETAIL_LABELS: Record<LiveStatusDetail, string> = {
  delayed: 'RETRASADO',
  postponed: 'POSPUESTO',
  suspended: 'SUSPENDIDO',
  canceled: 'CANCELADO',
}

export function isMatchDelayed(match: Pick<Match, 'live_status_detail'>): boolean {
  return match.live_status_detail === 'delayed'
}

export function isMatchHalftime(match: Pick<Match, 'live_clock_display'>): boolean {
  return match.live_clock_display === 'HT'
}

export function isMatchInterrupted(
  match: Pick<Match, 'live_status_detail'>,
): boolean {
  return Boolean(match.live_status_detail)
}

export function formatScheduledStatusLabel(
  match: Pick<Match, 'live_status_detail'>,
): string | null {
  if (!match.live_status_detail) return null
  return LIVE_STATUS_DETAIL_LABELS[match.live_status_detail] ?? null
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
  match: Pick<Match, 'current_minute' | 'live_clock_display' | 'status' | 'live_status_detail'>,
): string {
  if (match.live_clock_display === 'HT') return 'ENTRETIEMPO'

  const detailLabel = match.live_status_detail
    ? LIVE_STATUS_DETAIL_LABELS[match.live_status_detail]
    : null

  // Retrasado / pospuesto / cancelado: priorizar el estatus, sin reloj engañoso.
  if (
    match.live_status_detail === 'delayed' ||
    match.live_status_detail === 'postponed' ||
    match.live_status_detail === 'canceled'
  ) {
    return detailLabel!
  }

  const clock = formatMatchClock(match)

  // Suspendido: estatus + último minuto conocido.
  if (match.live_status_detail === 'suspended') {
    return clock ? `${detailLabel} · ${clock}` : detailLabel!
  }

  return clock ? `EN VIVO · ${clock}` : 'EN VIVO'
}
