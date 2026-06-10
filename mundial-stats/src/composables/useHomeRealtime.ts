import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMatchStore } from '@/stores/matchStore'
import type { RealtimeChannel } from '@supabase/supabase-js/dist/common.js/dist/common.js'

const STATUS_REFRESH_MS = 60_000

export function useHomeRealtime() {
  const matchStore = useMatchStore()
  let channel: RealtimeChannel | null = null
  let statusTimer: ReturnType<typeof setInterval> | null = null

  onMounted(async () => {
    await Promise.all([matchStore.fetchLiveMatches(), matchStore.fetchMatches()])

    channel = supabase
      .channel('home-live-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        async () => {
          await Promise.all([matchStore.fetchLiveMatches(), matchStore.fetchMatches()])
        },
      )
      .subscribe()

    statusTimer = setInterval(() => {
      matchStore.refreshEffectiveStates()
    }, STATUS_REFRESH_MS)
  })

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel)
    if (statusTimer) clearInterval(statusTimer)
  })
}
