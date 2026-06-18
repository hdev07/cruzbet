import { formatClockLabel, parseClockDisplay, toCurrentMinute } from './clock.js'
import type { LiveMatchSnapshot, ParsedGoal } from './types.js'

const GOOGLE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'es-MX,es;q=0.9',
  Accept: 'text/html,application/xhtml+xml',
}

/** Intenta leer el banner deportivo de Google (bloqueado en la mayoría de servidores). */
export async function fetchGoogleSportsSnapshot(
  homeName: string,
  awayName: string,
): Promise<LiveMatchSnapshot | null> {
  const query = encodeURIComponent(`${homeName} vs ${awayName} copa mundial 2026`)
  const url = `https://www.google.com/search?q=${query}&hl=es&gl=mx`

  try {
    const res = await fetch(url, { headers: GOOGLE_HEADERS, redirect: 'follow' })
    if (!res.ok) return null

    const html = await res.text()
    if (html.includes('SG_REL') || html.includes('unusual traffic')) return null

    return parseGoogleSportsHtml(html)
  } catch {
    return null
  }
}

function parseGoogleSportsHtml(html: string): LiveMatchSnapshot | null {
  const scoreMatch = html.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (!scoreMatch) return null

  const statusMatch = html.match(/Finalizado|En vivo|(?:^|[^\d])(\d{1,2}(?:\+\d+)?)'(?:[^\d]|$)/i)
  let status: LiveMatchSnapshot['status'] = 'scheduled'
  let currentMinute = 0
  let liveClockDisplay: string | null = null

  if (/Finalizado/i.test(html)) {
    status = 'finished'
    liveClockDisplay = 'FT'
    currentMinute = 90
  } else if (/En vivo/i.test(html)) {
    status = 'live'
    const clock = html.match(/(\d{1,2}(?:\+\d+)?)'/)
    if (clock) {
      liveClockDisplay = formatClockLabel(clock[1]!)
      const parsed = parseClockDisplay(clock[1]!)
      currentMinute = toCurrentMinute(parsed.minute, parsed.extra_time)
    }
  } else if (/Entretiempo|Medio tiempo/i.test(html)) {
    status = 'live'
    liveClockDisplay = 'HT'
    currentMinute = 45
  }

  if (statusMatch && status === 'scheduled' && /\d/.test(statusMatch[0])) {
    status = 'live'
  }

  const goals: ParsedGoal[] = []
  const goalPattern =
    /([A-Za-zÀ-ÿ\u00f1\u00d1\s.'-]{3,40})\s*(\d{1,2}(?:\+\d+)?)'/g
  let goalMatch: RegExpExecArray | null
  while ((goalMatch = goalPattern.exec(html)) !== null) {
    const player = goalMatch[1]!.trim()
    if (player.length < 4 || /México|Sudáfrica|Copa|Grupo/i.test(player)) continue
    const parsed = parseClockDisplay(goalMatch[2]!)
    goals.push({
      sync_key: `google:${parsed.minute}+${parsed.extra_time}:${player.toLowerCase()}`,
      team_side: 'home',
      minute: parsed.minute,
      extra_time: parsed.extra_time,
      event_second: 0,
      player,
      goal_type: 'foot',
      source: 'google',
    })
  }

  return {
    status,
    current_minute: currentMinute,
    live_clock_display: liveClockDisplay,
    home_score: Number.parseInt(scoreMatch[1]!, 10),
    away_score: Number.parseInt(scoreMatch[2]!, 10),
    goals,
    external_event_id: null,
    source: 'google',
  }
}
