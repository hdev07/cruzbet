export interface ParsedClock {
  minute: number
  extra_time: number
}

export function parseClockDisplay(display: string): ParsedClock {
  const normalized = display.trim()
  if (normalized === 'HT') return { minute: 45, extra_time: 0 }
  if (!normalized || normalized === 'FT' || normalized === 'ET') {
    return { minute: 0, extra_time: 0 }
  }

  const match = normalized.match(/^(\d+)'?(?:\+(\d+))?'?$/)
  if (!match) return { minute: 0, extra_time: 0 }

  return {
    minute: Number.parseInt(match[1]!, 10),
    extra_time: match[2] ? Number.parseInt(match[2], 10) : 0,
  }
}

export function formatClockDisplay(display: string): string | null {
  const normalized = display.trim()
  if (!normalized) return null
  if (normalized === 'HT' || normalized === 'FT' || normalized === 'ET') {
    return normalized
  }

  const parsed = parseClockDisplay(normalized)
  if (parsed.minute <= 0) return null
  return parsed.extra_time > 0
    ? `${parsed.minute}+${parsed.extra_time}'`
    : `${parsed.minute}'`
}

export function currentMinuteFromClock(display: string, finished: boolean): number | null {
  if (finished || display.trim() === 'FT') return 90
  const parsed = parseClockDisplay(display)
  if (parsed.minute <= 0) return null
  return parsed.minute + parsed.extra_time
}
