<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    /** Segundos base; se alarga si el texto es más largo. */
    duration?: number
    /** Retraso inicial en segundos (para desfasar filas). */
    delay?: number
  }>(),
  { duration: 3.5, delay: 0 },
)

const wrapRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const shouldScroll = ref(false)
const distance = ref(0)
const animDuration = ref(props.duration)

let observer: ResizeObserver | null = null

function measure() {
  const wrap = wrapRef.value
  const text = textRef.value
  if (!wrap || !text) return

  const overflow = text.scrollWidth - wrap.clientWidth
  shouldScroll.value = overflow > 2
  distance.value = Math.max(0, overflow)
  animDuration.value = Math.max(props.duration, overflow / 18 + 2)
}

onMounted(async () => {
  await nextTick()
  measure()
  observer = new ResizeObserver(() => measure())
  if (wrapRef.value) observer.observe(wrapRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(
  () => props.text,
  async () => {
    await nextTick()
    measure()
  },
)
</script>

<template>
  <div ref="wrapRef" class="marquee-text overflow-hidden whitespace-nowrap">
    <span
      ref="textRef"
      class="inline-block max-w-none"
      :class="{ 'marquee-text__scroll': shouldScroll }"
      :style="
        shouldScroll
          ? {
              '--marquee-distance': `${distance}px`,
              '--marquee-duration': `${animDuration}s`,
              '--marquee-delay': `${delay}s`,
            }
          : undefined
      "
    >
      {{ text }}
    </span>
  </div>
</template>

<style scoped>
.marquee-text__scroll {
  animation: marquee-reveal var(--marquee-duration, 3.5s) ease-in-out infinite;
  animation-delay: var(--marquee-delay, 0s);
}

@keyframes marquee-reveal {
  0%,
  18% {
    transform: translateX(0);
  }
  48%,
  58% {
    transform: translateX(calc(-1 * var(--marquee-distance, 0px)));
  }
  88%,
  100% {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-text__scroll {
    animation: none;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
