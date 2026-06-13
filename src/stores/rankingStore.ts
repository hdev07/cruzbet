import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export const useRankingStore = defineStore('ranking', () => {
  const leaders = ref<Profile[]>([])
  const loading = ref(false)

  async function fetchGlobalRanking() {
    loading.value = true
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false })
      .limit(50)

    if (!error && data) leaders.value = data as Profile[]
    loading.value = false
  }

  function patchProfile(profile: Profile) {
    const idx = leaders.value.findIndex((p) => p.id === profile.id)
    if (idx >= 0) {
      leaders.value[idx] = profile
      leaders.value.sort((a, b) => b.points - a.points)
      return
    }
    if (profile.points > 0) {
      void fetchGlobalRanking()
    }
  }

  return { leaders, loading, fetchGlobalRanking, patchProfile }
})
