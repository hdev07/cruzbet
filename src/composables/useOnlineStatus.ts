import { onMounted, onUnmounted, ref } from 'vue'

const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

function syncOnline() {
  online.value = navigator.onLine
}

let listeners = 0

function attach() {
  if (typeof window === 'undefined') return
  if (listeners === 0) {
    window.addEventListener('online', syncOnline)
    window.addEventListener('offline', syncOnline)
    syncOnline()
  }
  listeners += 1
}

function detach() {
  if (typeof window === 'undefined') return
  listeners = Math.max(0, listeners - 1)
  if (listeners === 0) {
    window.removeEventListener('online', syncOnline)
    window.removeEventListener('offline', syncOnline)
  }
}

/** Estado de red compartido (WiFi / datos / sin conexión). */
export function useOnlineStatus() {
  onMounted(attach)
  onUnmounted(detach)
  return { online }
}
