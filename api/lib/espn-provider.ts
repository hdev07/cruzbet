import { parseClockDisplay, toCurrentMinute } from './clock.js'
import type { DbMatchRow, LiveMatchSnapshot, ParsedGoal } from './types.js'

const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
const ESPN_SUMMARY =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary'

interface EspnCompetitor {
  homeAway: 'home' | 'away'
  score: string
  team: { abbreviation: string; id: string }
}

interface EspnEvent {
  id: string
  date: string
  competitions: Array<{
    id: string
    status: {
      type: { state: string; completed: boolean; description?: string }
      displayClock?: string
      period?: number
    }
    competitors: EspnCompetitor[]
  }>
}

interface EspnKeyEvent {
  id: string
  type: { text?: string; type?: string }
  scoringPlay?: boolean
  clock?: { displayValue?: string }
  team?: { id: string }
  participants?: Array<{ athlete?: { displayName?: string } }>
}

const ESPN_CODE_ALIASES: Record<string, string> = {
  KOR: 'KOR',
  KSA: 'KSA',
  USA: 'USA',
  ENG: 'ENG',
  IRN: 'IRN',
  CPV: 'CPV',
  CUW: 'CUW',
  COD: 'COD',
  CIV: 'CIV',
  NED: 'NED',
  SUI: 'SUI',
}

function normalizeCode(code: string): string {
  return ESPN_CODE_ALIASES[code.toUpperCase()] ?? code.toUpperCase()
}

function formatEspnDate(isoDate: string): string {
  const d = new Date(isoDate)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function mapEspnState(state: string, completed: boolean): LiveMatchSnapshot['status'] {
  if (completed || state === 'post') return 'finished'
  if (state === 'in') return 'live'
  return 'scheduled'
}

function isGoalEvent(event: EspnKeyEvent): boolean {
  const type = event.type?.type ?? event.type?.text ?? ''
  return event.scoringPlay === true || /goal/i.test(type)
}

export async function fetchEspnScoreboard(dateYmd: string): Promise<EspnEvent[]> {
  const url = `${ESPN_SCOREBOARD}?dates=${dateYmd}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`)
  const data = (await res.json()) as { events?: EspnEvent[] }
  return data.events ?? []
}

export async function fetchEspnGoals(eventId: string): Promise<EspnKeyEvent[]> {
  const url = `${ESPN_SUMMARY}?event=${eventId}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`)
  const data = (await res.json()) as { keyEvents?: EspnKeyEvent[] }
  return (data.keyEvents ?? []).filter(isGoalEvent)
}

export function findEspnEvent(
  events: EspnEvent[],
  homeCode: string,
  awayCode: string,
): EspnEvent | null {
  const home = normalizeCode(homeCode)
  const away = normalizeCode(awayCode)

  return (
    events.find((ev) => {
      const comp = ev.competitions[0]
      if (!comp) return false
      const codes = comp.competitors.map((c) => normalizeCode(c.team.abbreviation))
      return codes.includes(home) && codes.includes(away)
    }) ?? null
  )
}

export async function buildEspnSnapshot(
  event: EspnEvent,
  homeCode: string,
  awayCode: string,
): Promise<LiveMatchSnapshot> {
  const comp = event.competitions[0]!
  const status = comp.status
  const homeComp = comp.competitors.find((c) => c.homeAway === 'home')
  const awayComp = comp.competitors.find((c) => c.homeAway === 'away')

  const matchStatus = mapEspnState(
    status.type.state,
    status.type.completed ?? false,
  )

  let currentMinute = 0
  if (status.displayClock) {
    const parsed = parseClockDisplay(status.displayClock)
    currentMinute = toCurrentMinute(parsed.minute, parsed.extra_time)
  } else if (matchStatus === 'finished') {
    currentMinute = 90
  }

  const homeTeamId = homeComp?.team.id
  const goalEvents = await fetchEspnGoals(event.id)
  const goals: ParsedGoal[] = goalEvents.map((g) => {
    const parsed = parseClockDisplay(g.clock?.displayValue ?? "0'")
    const isHome = g.team?.id === homeTeamId
    const player = g.participants?.[0]?.athlete?.displayName ?? null
    return {
      sync_key: `espn:${g.id}`,
      team_side: isHome ? 'home' : 'away',
      minute: parsed.minute,
      extra_time: parsed.extra_time,
      event_second: 0,
      player,
      source: 'espn',
    }
  })

  return {
    status: matchStatus,
    current_minute: currentMinute,
    home_score: Number.parseInt(homeComp?.score ?? '0', 10),
    away_score: Number.parseInt(awayComp?.score ?? '0', 10),
    goals,
    external_event_id: event.id,
    source: 'espn',
  }
}

export async function fetchLiveSnapshotForMatch(
  match: DbMatchRow,
  cachedEvents?: EspnEvent[],
): Promise<LiveMatchSnapshot | null> {
  if (!match.match_date) return null

  const dateYmd = formatEspnDate(match.match_date)
  const events = cachedEvents ?? (await fetchEspnScoreboard(dateYmd))
  const event = findEspnEvent(events, match.home_team.code, match.away_team.code)
  if (!event) return null

  return buildEspnSnapshot(event, match.home_team.code, match.away_team.code)
}

export { formatEspnDate }
