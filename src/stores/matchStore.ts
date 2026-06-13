import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isEffectivelyLive, withEffectiveMatchState } from '@/lib/matchLifecycle'
import { supabase } from '@/lib/supabase'
import type { Match, MatchEvent } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export const useMatchStore = defineStore('match', () => {
  const matches = ref<Match[]>([])
  const liveMatches = ref<Match[]>([])
  const currentMatch = ref<Match | null>(null)
  const events = ref<MatchEvent[]>([])
  const loading = ref(false)

  async function fetchMatches() {
    loading.value = true
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .order('match_date', { ascending: true })

    if (!error && data) {
      matches.value = (data as Match[]).map((m) => withEffectiveMatchState(m))
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
      .select('*, players(name, number), teams(name, code, flag_url)')
      .eq('match_id', matchId)
      .order('minute', { ascending: true })
      .order('extra_time', { ascending: true })

    if (!error && data) events.value = data as MatchEvent[]
  }

  function addEvent(event: MatchEvent) {
    if (!events.value.find((e) => e.id === event.id)) {
      events.value.push(event)
      events.value.sort(
        (a, b) => a.minute - b.minute || a.extra_time - b.extra_time,
      )
    }
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
      updateMatch({ ...existing, ...patch })
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
    loading,
    fetchMatches,
    fetchLiveMatches,
    fetchMatch,
    fetchEvents,
    addEvent,
    updateMatch,
    applyMatchPatch,
    refreshEffectiveStates,
  }
})
