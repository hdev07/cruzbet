import { onMounted, onUnmounted, ref } from 'vue'

/** Reloj compartido para ventanas de tiempo del ciclo de partido (p. ej. 2 h post-final). */
export function useMatchLifecycleClock(intervalMs = 60_000) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return now
}
