import {
  currentMinuteFromClock,
  formatClockDisplay,
  parseClockDisplay,
} from './clock.js'
import type {
  DbMatchRow,
  EspnMatchSnapshot,
  MatchStatus,
  SyncedMatchEvent,
  TeamSide,
} from './types.js'

const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard'
const ESPN_SUMMARY =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/summary'

const FETCH_TIMEOUT_MS = 12_000
const FETCH_RETRIES = 2

interface EspnTeam {
  id: string
  abbreviation?: string
  displayName?: string
  shortDisplayName?: string
  name?: string
  location?: string
}

interface EspnCompetitor {
  homeAway: 'home' | 'away'
  score?: unknown
  team: EspnTeam
}

export interface EspnStatus {
  type: {
    state?: string
    completed?: boolean
    name?: string
    description?: string
    detail?: string
    shortDetail?: string
  }
  displayClock?: string
}

interface EspnCompetition {
  date?: string
  status: EspnStatus
  competitors: EspnCompetitor[]
}

export interface EspnEvent {
  id: string
  date: string
  competitions: EspnCompetition[]
}

interface EspnPlay {
  id: string
  type?: { text?: string; type?: string }
  text?: string
  shortText?: string
  scoringPlay?: boolean
  shootout?: boolean
  period?: { number?: number }
  clock?: { value?: number; displayValue?: string }
  team?: { id?: string; displayName?: string }
  participants?: Array<{
    athlete?: { id?: string; displayName?: string }
  }>
  wallclock?: string
}

interface EspnSummary {
  header?: { competitions?: EspnCompetition[] }
  keyEvents?: EspnPlay[]
  commentary?: Array<{ play?: EspnPlay }>
}

const TEAM_ALIASES: Record<string, string> = {
  'america': 'america',
  'club america': 'america',
  'atletico san luis': 'atletico de san luis',
  'atletico de san luis': 'atletico de san luis',
  'chivas': 'guadalajara',
  'chivas guadalajara': 'guadalajara',
  'guadalajara': 'guadalajara',
  'fc juarez': 'juarez',
  'juarez': 'juarez',
  'pumas': 'pumas',
  'pumas unam': 'pumas',
  'santos': 'santos laguna',
  'santos laguna': 'santos laguna',
  'tigres': 'tigres',
  'tigres uanl': 'tigres',
}

export function canonicalTeamName(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  return TEAM_ALIASES[normalized] ?? normalized
}

function espnTeamNames(team: EspnTeam): string[] {
  return [
    team.displayName,
    team.shortDisplayName,
    team.name,
    team.location,
  ].filter((value): value is string => Boolean(value))
}

function teamMatches(team: EspnTeam, expectedName: string): boolean {
  const expected = canonicalTeamName(expectedName)
  return espnTeamNames(team).some(
    (candidate) => canonicalTeamName(candidate) === expected,
  )
}

export function findEspnEvent(
  events: EspnEvent[],
  homeName: string,
  awayName: string,
): EspnEvent | null {
  return (
    events.find((event) => {
      const competition = event.competitions[0]
      const home = competition?.competitors.find(
        (competitor) => competitor.homeAway === 'home',
      )
      const away = competition?.competitors.find(
        (competitor) => competitor.homeAway === 'away',
      )

      return (
        Boolean(home && away) &&
        teamMatches(home!.team, homeName) &&
        teamMatches(away!.team, awayName)
      )
    }) ?? null
  )
}

function parseScore(score: unknown): number {
  if (typeof score === 'number') return score
  if (typeof score === 'string') {
    const parsed = Number.parseInt(score, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (score && typeof score === 'object') {
    const candidate = score as { value?: number; displayValue?: string }
    return parseScore(candidate.value ?? candidate.displayValue ?? 0)
  }
  return 0
}

function mapStatus(status: EspnStatus): MatchStatus {
  if (status.type.completed || status.type.state === 'post') return 'finished'
  if (status.type.state === 'in') return 'live'
  return 'scheduled'
}

function espnStatusText(status: EspnStatus): string {
  return [
    status.type.name,
    status.type.description,
    status.type.detail,
    status.type.shortDetail,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Solo el nombre/descripción oficial de ESPN (no detail/shortDetail:
 * ahí suele quedar el último reloj, p. ej. 45'+4', y no indica HT).
 */
export function isHalftimeStatus(status: EspnStatus): boolean {
  const text = [status.type.name, status.type.description]
    .filter(Boolean)
    .join(' ')

  return (
    /STATUS_HALFTIME/i.test(text) ||
    /(?:^|[^a-z])(?:half[\s_-]?time|halftime|entretiempo|medio tiempo)(?:[^a-z]|$)/i.test(
      text,
    )
  )
}

export function normalizeEspnStatusDetail(
  status: EspnStatus,
): 'delayed' | 'postponed' | 'suspended' | 'canceled' | null {
  const text = espnStatusText(status)
  const name = status.type.name ?? ''

  if (/STATUS_DELAYED|STATUS_RAIN_DELAY/i.test(name) || /delay|retras/i.test(text)) {
    return 'delayed'
  }
  if (/STATUS_POSTPONED/i.test(name) || /postpon|pospuest/i.test(text)) {
    return 'postponed'
  }
  if (
    /STATUS_SUSPENDED|STATUS_ABANDONED/i.test(name) ||
    /suspend|abandon/i.test(text)
  ) {
    return 'suspended'
  }
  if (
    /STATUS_CANCELED|STATUS_CANCELLED/i.test(name) ||
    /cancel/i.test(text)
  ) {
    return 'canceled'
  }
  return null
}

export function normalizeEspnClock(status: EspnStatus): string | null {
  // Tiempo agregado del 1T (45+N') se conserva hasta el cambio oficial a HT.
  if (isHalftimeStatus(status)) return 'HT'
  if (mapStatus(status) === 'finished') return 'FT'
  return formatClockDisplay(status.displayClock ?? '')
}

function playType(play: EspnPlay): string {
  return (play.type?.type ?? play.type?.text ?? '').toLowerCase()
}

function isVarPlay(play: EspnPlay): boolean {
  return /^var\b|var---|video assistant/i.test(playType(play))
}

function eventType(play: EspnPlay): SyncedMatchEvent['event_type'] | null {
  const type = playType(play)

  if (
    play.scoringPlay === true &&
    play.shootout !== true &&
    !/cancel|disallow|var/.test(type)
  ) {
    return 'goal'
  }
  if (/yellow.?card|red.?card|second.?yellow/.test(type)) return 'card'
  if (/substitution/.test(type)) return 'substitution'
  if (isVarPlay(play)) return 'var_review'
  return null
}

function teamSide(play: EspnPlay, homeTeamId: string, awayTeamId: string): TeamSide {
  if (play.team?.id === homeTeamId) return 'home'
  if (play.team?.id === awayTeamId) return 'away'
  return null
}

function goalType(play: EspnPlay): string {
  const text = `${playType(play)} ${play.text ?? ''}`.toLowerCase()
  if (/own.?goal/.test(text)) return 'own_goal'
  if (/penalt/.test(text)) return 'penalty'
  if (/header|headed/.test(text)) return 'header'
  if (/free.?kick/.test(text)) return 'free_kick'
  return 'foot'
}

function cardType(play: EspnPlay): string {
  const text = `${playType(play)} ${play.text ?? ''}`.toLowerCase()
  if (/second.?yellow/.test(text)) return 'second_yellow'
  if (/red.?card/.test(text)) return 'red'
  return 'yellow'
}

export function normalizeEspnPlay(
  play: EspnPlay,
  homeTeamId: string,
  awayTeamId: string,
): SyncedMatchEvent | null {
  const normalizedType = eventType(play)
  if (!play.id || !normalizedType) return null

  const displayClock = play.clock?.displayValue ?? ''
  const parsedClock = parseClockDisplay(displayClock)
  const player = play.participants?.[0]?.athlete

  return {
    external_event_id: play.id,
    event_type: normalizedType,
    team_side: teamSide(play, homeTeamId, awayTeamId),
    minute: parsedClock.minute,
    extra_time: parsedClock.extra_time,
    event_second: Math.max(0, Math.trunc(play.clock?.value ?? 0) % 60),
    metadata: {
      provider_type: playType(play),
      text: play.text ?? play.shortText ?? null,
      player: player?.displayName ?? null,
      athlete_id: player?.id ?? null,
      period: play.period?.number ?? null,
      clock: displayClock || null,
      wallclock: play.wallclock ?? null,
      ...(normalizedType === 'goal' ? { goal_type: goalType(play) } : {}),
      ...(normalizedType === 'card' ? { card_type: cardType(play) } : {}),
    },
  }
}

export function normalizeEspnEvents(
  summary: EspnSummary | null,
  homeTeamId: string,
  awayTeamId: string,
): { complete: boolean; events: SyncedMatchEvent[] } {
  if (!Array.isArray(summary?.keyEvents)) {
    return { complete: false, events: [] }
  }

  const byId = new Map<string, SyncedMatchEvent>()

  for (const play of summary.keyEvents) {
    const event = normalizeEspnPlay(play, homeTeamId, awayTeamId)
    if (event) byId.set(event.external_event_id, event)
  }

  // Los goles/tarjetas autoritativos vienen de keyEvents. Commentary se usa
  // solamente para mostrar revisiones VAR; incluir sus goles podría revivir
  // un gol anulado que ESPN ya retiró de keyEvents.
  for (const entry of summary.commentary ?? []) {
    if (!entry.play || !isVarPlay(entry.play)) continue
    const event = normalizeEspnPlay(entry.play, homeTeamId, awayTeamId)
    if (event) byId.set(event.external_event_id, event)
  }

  return { complete: true, events: [...byId.values()] }
}

export function eventsMatchScore(
  events: SyncedMatchEvent[],
  homeScore: number,
  awayScore: number,
): boolean {
  const goals = events.filter((event) => event.event_type === 'goal').length
  return goals === homeScore + awayScore
}

async function fetchJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CruzBet/1.0',
        },
        signal: controller.signal,
      })

      if (response.ok) return (await response.json()) as T
      if (response.status === 404) return null
    } catch {
      // El siguiente intento usa una espera incremental.
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < FETCH_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
    }
  }

  return null
}

export async function fetchEspnScoreboard(dateYmd: string): Promise<EspnEvent[]> {
  const data = await fetchJson<{ events?: EspnEvent[] }>(
    `${ESPN_SCOREBOARD}?dates=${dateYmd}`,
  )
  return data?.events ?? []
}

async function fetchEspnSummary(eventId: string): Promise<EspnSummary | null> {
  return fetchJson<EspnSummary>(`${ESPN_SUMMARY}?event=${eventId}`)
}

function dateYmd(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '')
}

export function getEspnDateCandidates(isoDate: string): string[] {
  const timestamp = Date.parse(isoDate)
  if (!Number.isFinite(timestamp)) return []
  return [-1, 0, 1].map((offset) => dateYmd(timestamp + offset * 86_400_000))
}

export function mergeEspnEvents(...lists: EspnEvent[][]): EspnEvent[] {
  const byId = new Map<string, EspnEvent>()
  for (const list of lists) {
    for (const event of list) byId.set(event.id, event)
  }
  return [...byId.values()]
}

async function buildSnapshot(
  event: EspnEvent,
  summary: EspnSummary | null,
): Promise<EspnMatchSnapshot | null> {
  const scoreboardCompetition = event.competitions[0]
  const competition = summary?.header?.competitions?.[0] ?? scoreboardCompetition
  if (!competition) return null

  const home = competition.competitors.find(
    (competitor) => competitor.homeAway === 'home',
  )
  const away = competition.competitors.find(
    (competitor) => competitor.homeAway === 'away',
  )
  if (!home || !away) return null

  const status = mapStatus(competition.status)
  const displayClock = competition.status.displayClock ?? ''
  const clock = normalizeEspnClock(competition.status)
  const homeScore = parseScore(home.score)
  const awayScore = parseScore(away.score)
  const normalizedEvents = normalizeEspnEvents(
    summary,
    home.team.id,
    away.team.id,
  )

  return {
    provider: 'espn',
    external_event_id: event.id,
    scheduled_at: competition.date ?? event.date ?? null,
    status,
    status_detail: normalizeEspnStatusDetail(competition.status),
    current_minute: currentMinuteFromClock(
      clock ?? displayClock,
      status === 'finished',
    ),
    clock,
    home_score: homeScore,
    away_score: awayScore,
    events_complete:
      normalizedEvents.complete &&
      eventsMatchScore(normalizedEvents.events, homeScore, awayScore),
    events: normalizedEvents.events,
  }
}

export async function fetchEspnSnapshotForMatch(
  match: DbMatchRow,
  cachedScoreboard?: EspnEvent[],
): Promise<EspnMatchSnapshot | null> {
  let event: EspnEvent | null = null

  if (match.external_event_id) {
    const summary = await fetchEspnSummary(match.external_event_id)
    const competition = summary?.header?.competitions?.[0]
    if (competition) {
      event = {
        id: match.external_event_id,
        date: competition.date ?? match.match_date ?? '',
        competitions: [competition],
      }
      return buildSnapshot(event, summary)
    }
  }

  if (!match.match_date) return null

  let events = cachedScoreboard
  if (!events) {
    const lists = await Promise.all(
      getEspnDateCandidates(match.match_date).map(fetchEspnScoreboard),
    )
    events = mergeEspnEvents(...lists)
  }

  event = findEspnEvent(events, match.home_team.name, match.away_team.name)
  if (!event) return null

  const summary = await fetchEspnSummary(event.id)
  return buildSnapshot(event, summary)
}
