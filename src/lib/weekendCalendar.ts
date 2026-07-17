import type { Match } from '@/types'

export const MX_TIME_ZONE = 'America/Mexico_City'

export type CalendarDay = {
  dateKey: string
  label: string
  weekdayLabel: string
  isToday: boolean
  /** Día anterior a hoy, o hoy con todos los partidos terminados */
  isPast: boolean
  matches: Match[]
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Clave de día calendario en zona México (YYYY-MM-DD). */
export function dateKeyInTimeZone(iso: string | Date, timeZone = MX_TIME_ZONE): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${day}`
}

export function todayKey(now = Date.now(), timeZone = MX_TIME_ZONE): string {
  return dateKeyInTimeZone(new Date(now), timeZone)
}

/** 0=dom … 6=sáb en la zona dada. */
function weekdayInTimeZone(date: Date, timeZone = MX_TIME_ZONE): number {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(date)
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[short] ?? 0
}

function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(y!, m! - 1, d! + days, 18, 0, 0))
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`
}

function formatDayLabel(dateKey: string, timeZone = MX_TIME_ZONE): {
  label: string
  weekdayLabel: string
} {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utcNoon = new Date(Date.UTC(y!, m! - 1, d!, 18, 0, 0))
  const label = utcNoon.toLocaleDateString('es-MX', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const weekdayLabel = utcNoon.toLocaleDateString('es-MX', {
    timeZone,
    weekday: 'long',
  })
  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    weekdayLabel: weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1),
  }
}

/**
 * Ventana de jornada tipo fin de semana: jueves → lunes (hora México).
 * Mar/mié apuntan al próximo jueves–lunes.
 */
export function getWeekendWindow(now = Date.now(), timeZone = MX_TIME_ZONE): {
  startKey: string
  endKey: string
} {
  const today = todayKey(now, timeZone)
  const [y, m, d] = today.split('-').map(Number)
  const ref = new Date(Date.UTC(y!, m! - 1, d!, 18, 0, 0))
  const weekday = weekdayInTimeZone(ref, timeZone)

  let daysFromThursday: number
  if (weekday >= 4) {
    daysFromThursday = weekday - 4
  } else if (weekday <= 1) {
    // Dom (0) o lun (1): aún en el bloque jue–lun
    daysFromThursday = weekday + 3
  } else {
    // Mar (2) / mié (3) → próximo jueves
    daysFromThursday = weekday - 4
  }

  const startKey = addDaysToKey(today, -daysFromThursday)
  const endKey = addDaysToKey(startKey, 4)
  return { startKey, endKey }
}

function isKeyInRange(key: string, startKey: string, endKey: string): boolean {
  return key >= startKey && key <= endKey
}

/**
 * Agrupa partidos por día en la ventana jue–lun.
 * Si no hay partidos ahí, usa el cluster de días más cercano al momento actual.
 */
export function buildWeekendCalendar(
  matches: Match[],
  now = Date.now(),
  timeZone = MX_TIME_ZONE,
): CalendarDay[] {
  const withDate = matches.filter((m) => m.match_date)
  if (!withDate.length) return []

  const { startKey, endKey } = getWeekendWindow(now, timeZone)
  let inWindow = withDate.filter((m) =>
    isKeyInRange(dateKeyInTimeZone(m.match_date!, timeZone), startKey, endKey),
  )

  if (!inWindow.length) {
    const sorted = [...withDate].sort(
      (a, b) =>
        Math.abs(new Date(a.match_date!).getTime() - now) -
        Math.abs(new Date(b.match_date!).getTime() - now),
    )
    const anchorKey = dateKeyInTimeZone(sorted[0]!.match_date!, timeZone)
    const keys = new Set<string>()
    for (let offset = -1; offset <= 3; offset++) {
      keys.add(addDaysToKey(anchorKey, offset))
    }
    inWindow = withDate.filter((m) => keys.has(dateKeyInTimeZone(m.match_date!, timeZone)))
  }

  const byDay = new Map<string, Match[]>()
  for (const match of inWindow) {
    const key = dateKeyInTimeZone(match.match_date!, timeZone)
    const list = byDay.get(key) ?? []
    list.push(match)
    byDay.set(key, list)
  }

  const today = todayKey(now, timeZone)

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayMatches]) => {
      const sorted = [...dayMatches].sort(
        (a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime(),
      )
      const { label, weekdayLabel } = formatDayLabel(dateKey, timeZone)
      const allFinished = sorted.every((m) => m.status === 'finished')
      return {
        dateKey,
        label,
        weekdayLabel,
        isToday: dateKey === today,
        isPast: dateKey < today || (dateKey === today && allFinished),
        matches: sorted,
      }
    })
}

export function formatMatchTime(match: Pick<Match, 'match_date'>, timeZone = MX_TIME_ZONE): string {
  if (!match.match_date) return 'Por definir'
  return new Date(match.match_date).toLocaleTimeString('es-MX', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMatchDate(match: Pick<Match, 'match_date'>, timeZone = MX_TIME_ZONE): string {
  if (!match.match_date) return 'Fecha por definir'
  return new Date(match.match_date).toLocaleDateString('es-MX', {
    timeZone,
    day: 'numeric',
    month: 'short',
  }).replace('.', '')
}
