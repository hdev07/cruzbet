import { onMounted, onUnmounted, watch } from 'vue'
import { hasMatchesInSyncWindow, SYNC_INTERVAL_MS, triggerLiveSync } from '@/lib/liveSync'
import { useMatchStore } from '@/stores/matchStore'

/** Polling gratuito: sincroniza mientras alguien tenga la app abierta durante un partido. */
export function useLiveSync() {
  const matchStore = useMatchStore()
  let timer: ReturnType<typeof setInterval> | null = null
  let syncing = false

  async function runSync() {
    if (syncing) return
    if (!hasMatchesInSyncWindow(matchStore.matches)) return

    syncing = true
    try {
      const result = await triggerLiveSync()
      if (result.ok) {
        await Promise.all([matchStore.fetchLiveMatches(), matchStore.fetchMatches()])
      }
    } finally {
      syncing = false
    }
  }

  function startPolling() {
    if (timer) return
    void runSync()
    timer = setInterval(() => void runSync(), SYNC_INTERVAL_MS)
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function refreshPolling() {
    if (hasMatchesInSyncWindow(matchStore.matches)) {
      startPolling()
    } else {
      stopPolling()
    }
  }

  onMounted(async () => {
    if (matchStore.matches.length === 0) {
      await matchStore.fetchMatches()
    }
    refreshPolling()
    watch(() => matchStore.matches, refreshPolling, { deep: true })
  })

  onUnmounted(stopPolling)

  return { runSync }
}
