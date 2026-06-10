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

  return { leaders, loading, fetchGlobalRanking }
})
