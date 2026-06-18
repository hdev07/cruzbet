import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isEffectivelyLive, withEffectiveMatchState } from '@/lib/matchLifecycle'
import { mergeLiveClockPatch } from '@/lib/matchClock'
import { sortGoalEvents } from '@/lib/goalDisplay'
import { warmFlagCache } from '@/lib/flagCache'
import { supabase } from '@/lib/supabase'
import type { Match, MatchEvent } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

function collectFlagUrls(matchList: Match[]): string[] {
  const urls: string[] = []
  for (const match of matchList) {
    if (match.home_team?.flag_url) urls.push(match.home_team.flag_url)
    if (match.away_team?.flag_url) urls.push(match.away_team.flag_url)
  }
  return urls
}

const EVENT_SELECT = '*, players(name, number), teams(name, code, flag_url)'

export const useMatchStore = defineStore('match', () => {
  const matches = ref<Match[]>([])
  const liveMatches = ref<Match[]>([])
  const currentMatch = ref<Match | null>(null)
  const events = ref<MatchEvent[]>([])
  const eventsByMatchId = ref<Record<string, MatchEvent[]>>({})
  const eventsFetchedFor = ref<Set<string>>(new Set())
  const loading = ref(false)

  function setEventsForMatch(matchId: string, matchEvents: MatchEvent[]) {
    const sorted = sortGoalEvents(matchEvents)
    eventsByMatchId.value = { ...eventsByMatchId.value, [matchId]: sorted }
    if (currentMatch.value?.id === matchId) {
      events.value = sorted
    }
  }

  function getEventsForMatch(matchId: string): MatchEvent[] {
    return eventsByMatchId.value[matchId] ?? []
  }

  async function fetchEventsForMatches(matchIds: string[]) {
    const missing = matchIds.filter((id) => !eventsFetchedFor.value.has(id))
    if (!missing.length) return

    const { data, error } = await supabase
      .from('match_events')
      .select(EVENT_SELECT)
      .in('match_id', missing)
      .eq('event_type', 'goal')
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
      next[matchId] = sortGoalEvents(grouped[matchId] ?? [])
      eventsFetchedFor.value.add(matchId)
    }
    eventsByMatchId.value = next
  }

  async function fetchMatches() {
    loading.value = true
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .order('match_date', { ascending: true })

    if (!error && data) {
      matches.value = (data as Match[]).map((m) => withEffectiveMatchState(m))
      void warmFlagCache(collectFlagUrls(matches.value))
    }
    loading.value = false
  }

  async function fetchLiveMatches() {
    loading.value = liveMatches.value.length === 0
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('status', 'live')
      .order('match_date', { ascending: true })

    if (!error && data) {
      liveMatches.value = (data as Match[]).map((m) => withEffectiveMatchState(m))
      await fetchEventsForMatches(liveMatches.value.map((m) => m.id))
    }
    loading.value = false
  }

  async function fetchMatch(id: string) {
    loading.value = true
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('id', id)
      .single()

    if (!error && data) currentMatch.value = withEffectiveMatchState(data as Match)
    loading.value = false
  }

  async function fetchEvents(matchId: string) {
    const { data, error } = await supabase
      .from('match_events')
      .select(EVENT_SELECT)
      .eq('match_id', matchId)
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

    if (!events.value.find((e) => e.id === event.id)) {
      events.value.push(event)
      events.value = sortGoalEvents(events.value)
    }
  }

  function removeEvent(eventId: string, matchId: string) {
    const existing = eventsByMatchId.value[matchId] ?? []
    if (existing.length) {
      setEventsForMatch(
        matchId,
        existing.filter((e) => e.id !== eventId),
      )
    }
    events.value = events.value.filter((e) => e.id !== eventId)
  }

  function updateMatch(match: Match) {
    const effective = withEffectiveMatchState(match)
    const idx = matches.value.findIndex((m) => m.id === match.id)
    if (idx >= 0) matches.value[idx] = effective

    const liveIdx = liveMatches.value.findIndex((m) => m.id === match.id)
    if (isEffectivelyLive(effective)) {
      if (liveIdx >= 0) liveMatches.value[liveIdx] = effective
      else liveMatches.value.push(effective)
    } else if (liveIdx >= 0) {
      liveMatches.value.splice(liveIdx, 1)
    }

    if (currentMatch.value?.id === match.id) {
      currentMatch.value = effective
    }
  }

  function applyMatchPatch(patch: Match) {
    const existing = matches.value.find((m) => m.id === patch.id)
    if (existing) {
      updateMatch(mergeLiveClockPatch(existing, patch))
      return
    }
    void fetchMatch(patch.id)
  }

  function refreshEffectiveStates() {
    matches.value = matches.value.map((m) => withEffectiveMatchState(m))
    liveMatches.value = matches.value.filter((m) => isEffectivelyLive(m))
    if (currentMatch.value) {
      currentMatch.value = withEffectiveMatchState(currentMatch.value)
    }
  }

  return {
    matches,
    liveMatches,
    currentMatch,
    events,
    eventsByMatchId,
    loading,
    getEventsForMatch,
    fetchMatches,
    fetchLiveMatches,
    fetchMatch,
    fetchEvents,
    fetchEventsForMatches,
    addEvent,
    removeEvent,
    updateMatch,
    applyMatchPatch,
    refreshEffectiveStates,
  }
})
