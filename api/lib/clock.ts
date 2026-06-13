/** Parsea reloj tipo "67'", "90'+2'", "HT" → minuto de partido y agregado */
export function parseClockDisplay(display: string): {
  minute: number
  extra_time: number
} {
  const trimmed = display.trim()
  if (!trimmed || trimmed === 'HT' || trimmed === 'ET' || trimmed === 'FT') {
    return { minute: trimmed === 'HT' ? 45 : 0, extra_time: 0 }
  }

  const match = trimmed.match(/^(\d+)(?:\+(\d+))?'?$/)
  if (!match) return { minute: 0, extra_time: 0 }

  return {
    minute: Number.parseInt(match[1]!, 10),
    extra_time: match[2] ? Number.parseInt(match[2], 10) : 0,
  }
}

/** Minuto único para matches.current_minute (90+2 → 92) */
export function toCurrentMinute(minute: number, extraTime: number): number {
  return minute + extraTime
}

/** Etiqueta legible: "45+2'", "67'", "HT", "FT" */
export function formatClockLabel(display: string): string {
  const trimmed = display.trim()
  if (!trimmed) return ''
  if (trimmed === 'HT') return 'HT'
  if (trimmed === 'FT') return 'FT'
  if (trimmed === 'ET') return 'ET'

  const parsed = parseClockDisplay(trimmed)
  if (parsed.minute <= 0 && parsed.extra_time <= 0) return ''

  return parsed.extra_time > 0
    ? `${parsed.minute}+${parsed.extra_time}'`
    : `${parsed.minute}'`
}

export interface EspnClockStatus {
  type: {
    state: string
    completed?: boolean
    detail?: string
    shortDetail?: string
    description?: string
  }
  displayClock?: string
  period?: number
}

export function extractClockFromEspnStatus(
  status: EspnClockStatus,
  matchStatus: 'scheduled' | 'live' | 'finished',
): { current_minute: number; live_clock_display: string | null } {
  const display = status.displayClock?.trim() ?? ''
  const detail = [
    status.type.detail,
    status.type.shortDetail,
    status.type.description,
  ]
    .filter(Boolean)
    .join(' ')

  if (
    display === 'HT' ||
    /halftime/i.test(detail) ||
    /\bHT\b/.test(detail)
  ) {
    return { current_minute: 45, live_clock_display: 'HT' }
  }

  if (display === 'FT' || matchStatus === 'finished') {
    return { current_minute: 90, live_clock_display: 'FT' }
  }

  if (display) {
    const parsed = parseClockDisplay(display)
    return {
      current_minute: toCurrentMinute(parsed.minute, parsed.extra_time),
      live_clock_display: formatClockLabel(display),
    }
  }

  if (matchStatus === 'finished') {
    return { current_minute: 90, live_clock_display: 'FT' }
  }

  return { current_minute: 0, live_clock_display: null }
}
