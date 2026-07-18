import { defineStore } from 'pinia'
import { ref } from 'vue'

export type PwaCheckResult = 'available' | 'uptodate' | 'unavailable'

export const usePwaStore = defineStore('pwa', () => {
  const needRefresh = ref(false)
  const offlineReady = ref(false)
  const registered = ref(false)
  const checking = ref(false)
  const lastCheckedAt = ref<number | null>(null)
  const registration = ref<ServiceWorkerRegistration | null>(null)
  const updateFn = ref<((reloadPage?: boolean) => Promise<void>) | null>(null)

  function setUpdateHandler(fn: (reloadPage?: boolean) => Promise<void>) {
    updateFn.value = fn
  }

  function setRegistration(reg: ServiceWorkerRegistration | undefined) {
    registration.value = reg ?? null
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

  async function checkForUpdate(): Promise<PwaCheckResult> {
    lastCheckedAt.value = Date.now()

    if (needRefresh.value) return 'available'

    const reg = registration.value
    if (!reg) {
      if ('serviceWorker' in navigator) {
        const existing = await navigator.serviceWorker.getRegistration()
        if (existing) {
          registration.value = existing
        } else {
          return 'unavailable'
        }
      } else {
        return 'unavailable'
      }
    }

    const activeReg = registration.value
    if (!activeReg) return 'unavailable'

    checking.value = true
    try {
      await activeReg.update()

      // Esperar a que el nuevo SW termine de instalarse / active onNeedRefresh
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (needRefresh.value || activeReg.waiting) {
        if (activeReg.waiting && !needRefresh.value) {
          markNeedRefresh()
        }
        return 'available'
      }

      return 'uptodate'
    } catch {
      return 'unavailable'
    } finally {
      checking.value = false
    }
  }

  async function applyUpdate() {
    if (!updateFn.value) return
    await updateFn.value(true)
  }

  return {
    needRefresh,
    offlineReady,
    registered,
    checking,
    lastCheckedAt,
    setUpdateHandler,
    setRegistration,
    markRegistered,
    markNeedRefresh,
    markOfflineReady,
    checkForUpdate,
    applyUpdate,
  }
})
