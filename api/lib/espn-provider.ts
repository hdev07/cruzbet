import {
  extractClockFromEspnStatus,
  mergeLiveClock,
  parseClockDisplay,
} from './clock.js'
import type { DbMatchRow, LiveMatchSnapshot, ParsedCard, ParsedGoal, ParsedGoalType } from './types.js'

const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
const ESPN_SUMMARY =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary'

const ESPN_FETCH_TIMEOUT_MS = 12_000
const ESPN_FETCH_RETRIES = 2

interface EspnCompetitor {
  homeAway: 'home' | 'away'
  score: string
  team: { abbreviation: string; id: string }
}

interface EspnCompetition {
  id: string
  status: {
    type: {
      state: string
      completed: boolean
      description?: string
      detail?: string
      shortDetail?: string
    }
    displayClock?: string
    period?: number
  }
  competitors: EspnCompetitor[]
}

interface EspnEvent {
  id: string
  date: string
  competitions: EspnCompetition[]
}

interface EspnKeyEvent {
  id: string
  type: { text?: string; type?: string }
  text?: string
  shortText?: string
  scoringPlay?: boolean
  clock?: { displayValue?: string }
  team?: { id: string }
  participants?: Array<{ athlete?: { displayName?: string } }>
}

interface EspnSummary {
  header?: { competitions?: EspnCompetition[] }
  keyEvents?: EspnKeyEvent[]
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

function parseMatchIsoDate(isoDate: string): Date | null {
  const normalized = isoDate.replace(/([+-]\d{2})$/, '$1:00')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function formatEspnDateFromMs(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function formatEspnDate(isoDate: string): string {
  const d = parseMatchIsoDate(isoDate)
  if (!d) return ''
  return formatEspnDateFromMs(d.getTime())
}

/** ESPN agrupa partidos por fecha local; probamos día anterior, UTC y siguiente. */
export function getEspnDateCandidates(isoDate: string): string[] {
  const d = parseMatchIsoDate(isoDate)
  if (!d) return []

  const candidates = new Set<string>()
  for (const offsetDays of [-1, 0, 1]) {
    candidates.add(formatEspnDateFromMs(d.getTime() + offsetDays * 86_400_000))
  }
  return [...candidates]
}

export function mergeEspnEvents(...eventLists: EspnEvent[][]): EspnEvent[] {
  const byId = new Map<string, EspnEvent>()
  for (const list of eventLists) {
    for (const event of list) {
      byId.set(event.id, event)
    }
  }
  return [...byId.values()]
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

function isCardEvent(event: EspnKeyEvent): boolean {
  const type = (event.type?.type ?? event.type?.text ?? '').toLowerCase()
  const text = (event.text ?? event.shortText ?? '').toLowerCase()
  return /yellow.?card|red.?card|tarjeta/i.test(type) || /yellow card|red card|tarjeta/i.test(text)
}

function mapEspnCardType(event: EspnKeyEvent): ParsedCard['card_type'] {
  const type = (event.type?.type ?? event.type?.text ?? '').toLowerCase()
  const text = (event.text ?? event.shortText ?? '').toLowerCase()
  if (/red.?card|tarjeta roja/i.test(type) || /red card|tarjeta roja/i.test(text)) {
    return 'red'
  }
  return 'yellow'
}

function mapEspnGoalType(event: EspnKeyEvent): ParsedGoalType {
  const type = (event.type?.type ?? event.type?.text ?? '').toLowerCase()
  const text = (event.text ?? event.shortText ?? '').toLowerCase()

  if (/own.?goal|autogol|own goal/i.test(type) || /own goal|autogol/i.test(text)) {
    return 'own_goal'
  }
  if (/penalty/i.test(type) || /penalt/i.test(text)) {
    return 'penalty'
  }
  if (/header|cabez/i.test(type) || /header|cabez/i.test(text)) {
    return 'header'
  }
  if (/free.?kick|tiro libre/i.test(type) || /free kick|tiro libre/i.test(text)) {
    return 'free_kick'
  }
  return 'foot'
}

function parseGoalsFromKeyEvents(
  keyEvents: EspnKeyEvent[] | undefined,
  homeTeamId: string | undefined,
): ParsedGoal[] {
  return (keyEvents ?? []).filter(isGoalEvent).map((goal) => {
    const parsed = parseClockDisplay(goal.clock?.displayValue ?? "0'")
    const isHome = goal.team?.id === homeTeamId
    const player = goal.participants?.[0]?.athlete?.displayName ?? null
    return {
      sync_key: `espn:${goal.id}`,
      team_side: isHome ? 'home' : 'away',
      minute: parsed.minute,
      extra_time: parsed.extra_time,
      event_second: 0,
      player,
      goal_type: mapEspnGoalType(goal),
      source: 'espn',
    }
  })
}

function parseCardsFromKeyEvents(
  keyEvents: EspnKeyEvent[] | undefined,
  homeTeamId: string | undefined,
): ParsedCard[] {
  return (keyEvents ?? []).filter(isCardEvent).map((card) => {
    const parsed = parseClockDisplay(card.clock?.displayValue ?? "0'")
    const isHome = card.team?.id === homeTeamId
    const player = card.participants?.[0]?.athlete?.displayName ?? null
    return {
      sync_key: `espn:card:${card.id}`,
      team_side: isHome ? 'home' : 'away',
      minute: parsed.minute,
      extra_time: parsed.extra_time,
      event_second: 0,
      player,
      card_type: mapEspnCardType(card),
      source: 'espn',
    }
  })
}

async function fetchEspnJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt <= ESPN_FETCH_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), ESPN_FETCH_TIMEOUT_MS)
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) return (await res.json()) as T
      if (res.status === 404) return null
    } catch {
      // reintento abajo
    }

    if (attempt < ESPN_FETCH_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
    }
  }
  return null
}

export async function fetchEspnScoreboard(dateYmd: string): Promise<EspnEvent[]> {
  const url = `${ESPN_SCOREBOARD}?dates=${dateYmd}`
  const data = await fetchEspnJson<{ events?: EspnEvent[] }>(url)
  return data?.events ?? []
}

async function fetchEspnSummary(eventId: string): Promise<EspnSummary | null> {
  const url = `${ESPN_SUMMARY}?event=${eventId}`
  return fetchEspnJson<EspnSummary>(url)
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

async function buildEspnSnapshotFromCompetition(
  eventId: string,
  comp: EspnCompetition,
  summary?: EspnSummary | null,
  previousClock?: { current_minute?: number | null; live_clock_display?: string | null } | null,
): Promise<LiveMatchSnapshot> {
  const status = comp.status
  const homeComp = comp.competitors.find((c) => c.homeAway === 'home')
  const awayComp = comp.competitors.find((c) => c.homeAway === 'away')
  const homeTeamId = homeComp?.team.id

  const matchStatus = mapEspnState(
    status.type.state,
    status.type.completed ?? false,
  )

  let goals: ParsedGoal[] = []
  let cards: ParsedCard[] = []
  let keyEvents = summary?.keyEvents
  if (!keyEvents) {
    const fetchedSummary = await fetchEspnSummary(eventId)
    keyEvents = fetchedSummary?.keyEvents
  }
  goals = parseGoalsFromKeyEvents(keyEvents, homeTeamId)
  cards = parseCardsFromKeyEvents(keyEvents, homeTeamId)

  const clock = mergeLiveClock(
    extractClockFromEspnStatus(status, matchStatus),
    previousClock,
  )

  return {
    status: matchStatus,
    current_minute: clock.current_minute,
    live_clock_display: clock.live_clock_display,
    home_score: Number.parseInt(homeComp?.score ?? '0', 10),
    away_score: Number.parseInt(awayComp?.score ?? '0', 10),
    goals,
    cards,
    external_event_id: eventId,
    source: 'espn',
  }
}

export async function buildEspnSnapshot(
  event: EspnEvent,
  _homeCode: string,
  _awayCode: string,
  previousClock?: { current_minute?: number | null; live_clock_display?: string | null } | null,
): Promise<LiveMatchSnapshot> {
  const comp = event.competitions[0]!
  const summary = await fetchEspnSummary(event.id)
  const headerComp = summary?.header?.competitions?.[0]
  return buildEspnSnapshotFromCompetition(event.id, headerComp ?? comp, summary, previousClock)
}

async function fetchSnapshotByEventId(
  eventId: string,
  previousClock?: { current_minute?: number | null; live_clock_display?: string | null } | null,
): Promise<LiveMatchSnapshot | null> {
  const summary = await fetchEspnSummary(eventId)
  const comp = summary?.header?.competitions?.[0]
  if (!comp) return null
  return buildEspnSnapshotFromCompetition(eventId, comp, summary, previousClock)
}

async function resolveEspnEventsForMatch(
  match: DbMatchRow,
  cachedEvents?: EspnEvent[],
): Promise<EspnEvent[]> {
  if (cachedEvents?.length) return cachedEvents

  const dates = match.match_date ? getEspnDateCandidates(match.match_date) : []
  const lists = await Promise.all(dates.map((dateYmd) => fetchEspnScoreboard(dateYmd)))
  return mergeEspnEvents(...lists)
}

export async function fetchLiveSnapshotForMatch(
  match: DbMatchRow,
  cachedEvents?: EspnEvent[],
): Promise<LiveMatchSnapshot | null> {
  const previousClock = {
    current_minute: match.current_minute,
    live_clock_display: match.live_clock_display,
  }

  if (match.external_event_id) {
    const direct = await fetchSnapshotByEventId(match.external_event_id, previousClock)
    if (direct) return direct
  }

  if (!match.match_date) return null

  const events = await resolveEspnEventsForMatch(match, cachedEvents)
  const event = findEspnEvent(events, match.home_team.code, match.away_team.code)
  if (!event) return null

  return buildEspnSnapshot(event, match.home_team.code, match.away_team.code, previousClock)
}
