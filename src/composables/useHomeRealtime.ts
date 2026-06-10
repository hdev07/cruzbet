import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMatchStore } from '@/stores/matchStore'
import { usePredictionStore } from '@/stores/predictionStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

const STATUS_REFRESH_MS = 60_000

export function useHomeRealtime() {
  const matchStore = useMatchStore()
  const predictionStore = usePredictionStore()
  const participantCounts = ref<Record<string, number>>({})
  let channel: RealtimeChannel | null = null
  let statusTimer: ReturnType<typeof setInterval> | null = null

  async function loadParticipantCounts() {
    try {
      participantCounts.value = await predictionStore.fetchParticipantCountsByMatch()
    } catch {
      participantCounts.value = {}
    }
  }

  onMounted(async () => {
    await Promise.all([
      matchStore.fetchLiveMatches(),
      matchStore.fetchMatches(),
      loadParticipantCounts(),
    ])

    channel = supabase
      .channel('home-live-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        async () => {
          await Promise.all([matchStore.fetchLiveMatches(), matchStore.fetchMatches()])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => {
          void loadParticipantCounts()
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

  return { participantCounts }
}
