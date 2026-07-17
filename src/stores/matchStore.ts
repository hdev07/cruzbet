import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ACTIVE_COMPETITION_SLUG } from '@/constants/branding'
import { sortMatchEvents } from '@/lib/cardDisplay'
import {
  isEffectivelyLive,
  isRecentlyFinished,
  pickNextScheduledMatch,
  pickSpotlightMatches,
} from '@/lib/matchLifecycle'
import { supabase } from '@/lib/supabase'
import { buildWeekendCalendar } from '@/lib/weekendCalendar'
import type { Match, MatchEvent } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'
const EVENT_SELECT = '*, players(name, number), teams(name, code, flag_url)'

export const useMatchStore = defineStore('match', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const activeCompetitionId = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)
  const eventsByMatchId = ref<Record<string, MatchEvent[]>>({})
  const eventsFetchedFor = ref<Set<string>>(new Set())

  const liveMatches = computed(() => matches.value.filter((m) => isEffectivelyLive(m)))

  const nextMatch = computed(() => pickNextScheduledMatch(matches.value))

  const spotlightMatches = computed(() =>
    pickSpotlightMatches(matches.value, liveMatches.value),
  )

  const spotlightMatch = computed(() => spotlightMatches.value[0] ?? null)

  const spotlightIds = computed(() => new Set(spotlightMatches.value.map((m) => m.id)))

  const recentFinishedMatches = computed(() =>
    matches.value
      .filter((m) => isRecentlyFinished(m) && !spotlightIds.value.has(m.id))
      .sort(
        (a, b) =>
          new Date(b.match_date ?? 0).getTime() - new Date(a.match_date ?? 0).getTime(),
      )
      .slice(0, 4),
  )

  const upcomingMatches = computed(() =>
    matches.value
      .filter(
        (m) =>
          !spotlightIds.value.has(m.id) &&
          m.status === 'scheduled' &&
          m.match_date &&
          !isEffectivelyLive(m),
      )
      .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())
      .slice(0, 4),
  )

  const weekendDays = computed(() => buildWeekendCalendar(matches.value))

  async function fetchActiveCompetitionId(): Promise<string> {
    if (activeCompetitionId.value) return activeCompetitionId.value

    const { data, error } = await supabase
      .from('competitions')
      .select('id')
      .eq('slug', ACTIVE_COMPETITION_SLUG)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      throw error ?? new Error('No hay una temporada activa de Liga MX')
    }

    activeCompetitionId.value = data.id
    return data.id
  }

  function setEventsForMatch(matchId: string, matchEvents: MatchEvent[]) {
    eventsByMatchId.value = {
      ...eventsByMatchId.value,
      [matchId]: sortMatchEvents(matchEvents),
    }
  }

  function getEventsForMatch(matchId: string): MatchEvent[] {
    return eventsByMatchId.value[matchId] ?? []
  }

  async function fetchEventsForMatches(matchIds: string[], options?: { force?: boolean }) {
    const missing = options?.force
      ? matchIds
      : matchIds.filter((id) => !eventsFetchedFor.value.has(id))
    if (!missing.length) return

    const { data, error } = await supabase
      .from('match_events')
      .select(EVENT_SELECT)
      .in('match_id', missing)
      .in('event_type', ['goal', 'card'])
      .order('minute', { ascending: true })
      .order('extra_time', { ascending: true })

    const grouped: Record<string, MatchEvent[]> = {}
    for (const matchId of missing) {
      grouped[matchId] = []
    }

    if (!error && data) {
      for (const row of data as MatchEvent[]) {
        const list = grouped[row.match_id] ?? []
        list.push(row)
        grouped[row.match_id] = list
      }
    }

    const next = { ...eventsByMatchId.value }
    for (const matchId of missing) {
      next[matchId] = sortMatchEvents(grouped[matchId] ?? [])
      eventsFetchedFor.value.add(matchId)
    }
    eventsByMatchId.value = next
  }

  async function fetchEvents(matchId: string) {
    const { data, error } = await supabase
      .from('match_events')
      .select(EVENT_SELECT)
      .eq('match_id', matchId)
      .in('event_type', ['goal', 'card'])
      .order('minute', { ascending: true })
      .order('extra_time', { ascending: true })

    if (!error && data) {
      setEventsForMatch(matchId, data as MatchEvent[])
      eventsFetchedFor.value.add(matchId)
    }
  }

  function addEvent(event: MatchEvent) {
    const existing = eventsByMatchId.value[event.match_id] ?? []
    if (existing.find((e) => e.id === event.id)) return
    setEventsForMatch(event.match_id, [...existing, event])
  }

  function removeEvent(eventId: string, matchId: string) {
    const existing = eventsByMatchId.value[matchId] ?? []
    if (!existing.length) return
    setEventsForMatch(
      matchId,
      existing.filter((e) => e.id !== eventId),
    )
  }

  async function fetchMatches(options?: { force?: boolean }) {
    if (
      !options?.force &&
      lastFetchedAt.value &&
      Date.now() - lastFetchedAt.value < 30_000 &&
      matches.value.length
    ) {
      return
    }

    loading.value = matches.value.length === 0
    try {
      const competitionId = await fetchActiveCompetitionId()
      const { data, error } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('competition_id', competitionId)
        .order('match_date', { ascending: true })

      if (!error && data) {
        matches.value = data as Match[]
        lastFetchedAt.value = Date.now()

        const eventMatchIds = matches.value
          .filter((m) => isEffectivelyLive(m) || isRecentlyFinished(m))
          .map((m) => m.id)
        if (eventMatchIds.length) {
          void fetchEventsForMatches(eventMatchIds, { force: options?.force })
        }
      }
    } finally {
      loading.value = false
    }
  }

  return {
    matches,
    loading,
    liveMatches,
    nextMatch,
    spotlightMatch,
    spotlightMatches,
    recentFinishedMatches,
    upcomingMatches,
    weekendDays,
    eventsByMatchId,
    getEventsForMatch,
    fetchMatches,
    fetchEvents,
    fetchEventsForMatches,
    addEvent,
    removeEvent,
  }
})
