import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePwaStore = defineStore('pwa', () => {
  const needRefresh = ref(false)
  const offlineReady = ref(false)
  const registered = ref(false)
  const lastCheckedAt = ref<number | null>(null)
  const updateFn = ref<((reloadPage?: boolean) => Promise<void>) | null>(null)

  function setUpdateHandler(fn: (reloadPage?: boolean) => Promise<void>) {
    updateFn.value = fn
  }

  function markRegistered() {
    registered.value = true
    lastCheckedAt.value = Date.now()
  }

  function markNeedRefresh() {
    needRefresh.value = true
  }

  function markOfflineReady() {
    offlineReady.value = true
  }

  async function applyUpdate() {
    if (!updateFn.value) return
    await updateFn.value(true)
  }

  return {
    needRefresh,
    offlineReady,
    registered,
    lastCheckedAt,
    setUpdateHandler,
    markRegistered,
    markNeedRefresh,
    markOfflineReady,
    applyUpdate,
  }
})
