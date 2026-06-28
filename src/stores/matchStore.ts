import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Match } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export const useMatchStore = defineStore('match', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)

  async function fetchMatches() {
    loading.value = true
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .order('match_date', { ascending: true })

    if (!error && data) {
      matches.value = data as Match[]
    }
    loading.value = false
  }

  return {
    matches,
    loading,
    fetchMatches,
  }
})
