import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { mergeStandingsMatchPatch } from '@/lib/matchClock'
import { allGroupLetters, computeGroupStandings } from '@/lib/groupStandings'
import { supabase } from '@/lib/supabase'
import type { GroupStandings, Match, Team } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export const useGroupStandingsStore = defineStore('groupStandings', () => {
  const teams = ref<Team[]>([])
  const groupMatches = ref<Match[]>([])
  const loading = ref(false)
  const selectedGroup = ref('A')

  const standings = computed(() => computeGroupStandings(teams.value, groupMatches.value))

  const groupLetters = computed(() => {
    const fromData = standings.value.map((g) => g.groupName)
    return fromData.length ? fromData : allGroupLetters()
  })

  const currentStandings = computed(
    () => standings.value.find((g) => g.groupName === selectedGroup.value) ?? null,
  )

  async function fetchStandingsData() {
    loading.value = true

    const [teamsResult, matchesResult] = await Promise.all([
      supabase.from('teams').select('*').not('group_name', 'is', null).order('group_name'),
      supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('phase', 'group')
        .in('status', ['finished', 'live'])
        .order('match_date'),
    ])

    if (!teamsResult.error && teamsResult.data) {
      teams.value = teamsResult.data as Team[]
    }

    if (!matchesResult.error && matchesResult.data) {
      groupMatches.value = matchesResult.data as Match[]
    }

    if (!currentStandings.value && groupLetters.value.length) {
      selectedGroup.value = groupLetters.value[0]!
    }

    loading.value = false
  }

  function setSelectedGroup(group: string) {
    selectedGroup.value = group.toUpperCase()
  }

  function isStandingMatch(match: Match): boolean {
    return match.phase === 'group' && (match.status === 'finished' || match.status === 'live')
  }

  /** Fusiona partidos de grupo sin reemplazar toda la lista (evita carreras al cargar). */
  function refreshFromMatches(matches: Match[]) {
    const incoming = matches.filter(isStandingMatch)
    const removedIds = new Set(
      matches
        .filter((m) => m.phase === 'group' && !isStandingMatch(m))
        .map((m) => m.id),
    )

    const byId = new Map(groupMatches.value.map((m) => [m.id, m]))

    for (const match of incoming) {
      const existing = byId.get(match.id)
      byId.set(match.id, existing ? mergeStandingsMatchPatch(existing, match) : match)
    }

    groupMatches.value = [...byId.values()].filter((m) => !removedIds.has(m.id))
  }

  function patchMatch(match: Match) {
    if (match.phase !== 'group') return

    if (!isStandingMatch(match)) {
      groupMatches.value = groupMatches.value.filter((m) => m.id !== match.id)
      return
    }

    const existing = groupMatches.value.find((m) => m.id === match.id)
    if (existing) {
      const idx = groupMatches.value.findIndex((m) => m.id === match.id)
      groupMatches.value[idx] = mergeStandingsMatchPatch(existing, match)
      return
    }

    groupMatches.value.push(match)
  }

  return {
    teams,
    groupMatches,
    loading,
    selectedGroup,
    standings,
    groupLetters,
    currentStandings,
    fetchStandingsData,
    setSelectedGroup,
    refreshFromMatches,
    patchMatch,
  }
})
