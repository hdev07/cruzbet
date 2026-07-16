import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ACTIVE_COMPETITION_SLUG } from '@/constants/branding'
import {
  isEffectivelyLive,
  isRecentlyFinished,
  pickNextScheduledMatch,
  pickSpotlightMatches,
} from '@/lib/matchLifecycle'
import { supabase } from '@/lib/supabase'
import { buildWeekendCalendar } from '@/lib/weekendCalendar'
import type { Match } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export const useMatchStore = defineStore('match', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const activeCompetitionId = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)

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
    fetchMatches,
  }
})
