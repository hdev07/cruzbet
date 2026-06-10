import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMatchStore } from '@/stores/matchStore'
import type { MatchEvent } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js/dist/common.js/dist/common.js'

const STATUS_REFRESH_MS = 60_000

export function useRealtime(matchId: string) {
  const matchStore = useMatchStore()
  const events = ref<MatchEvent[]>([])
  let channel: RealtimeChannel | null = null
  let statusTimer: ReturnType<typeof setInterval> | null = null

  onMounted(async () => {
    await matchStore.fetchEvents(matchId)
    events.value = [...matchStore.events]

    channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const event = payload.new as MatchEvent
          matchStore.addEvent(event)
          events.value = [...matchStore.events]
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          matchStore.updateMatch(payload.new as Parameters<typeof matchStore.updateMatch>[0])
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

  return { events }
}
