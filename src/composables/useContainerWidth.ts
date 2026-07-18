import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/** Observa el ancho de un elemento (p. ej. contenedor de gráfica) vía ResizeObserver. */
export function useContainerWidth(target: Ref<HTMLElement | null>, fallback = 320) {
  const width = ref(fallback)
  let observer: ResizeObserver | null = null

  function disconnect() {
    observer?.disconnect()
    observer = null
  }

  watch(
    target,
    (el) => {
      disconnect()
      if (!el) return
      const update = () => {
        width.value = Math.max(0, Math.round(el.clientWidth))
      }
      update()
      if (typeof ResizeObserver === 'undefined') return
      observer = new ResizeObserver(update)
      observer.observe(el)
    },
    { flush: 'post', immediate: true },
  )

  onBeforeUnmount(disconnect)

  return width
}
