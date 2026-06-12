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
