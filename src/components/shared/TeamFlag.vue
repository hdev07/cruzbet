<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { teamCrestUrl } from '@/lib/teamDisplay'

const props = withDefaults(
  defineProps<{
    src?: string | null
    code?: string | null
    alt: string
    imgClass?: string
    size?: 'sm' | 'md' | 'lg'
    /** Carga inmediata (export PNG / cabeceras visibles). */
    eager?: boolean
  }>(),
  {
    src: null,
    code: null,
    imgClass: '',
    size: 'md',
    eager: false,
  },
)

const failed = ref(false)

const resolvedSrc = computed(() => {
  if (failed.value) return null
  if (props.src) return props.src
  return teamCrestUrl(props.code)
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-5 w-5'
    case 'lg':
      return 'h-9 w-9'
    default:
      return 'h-7 w-7'
  }
})

watch(
  () => [props.src, props.code] as const,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <img
    v-if="resolvedSrc"
    :src="resolvedSrc"
    :alt="alt"
    :class="[sizeClass, 'shrink-0 object-contain', imgClass]"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    @error="failed = true"
  />
  <span
    v-else
    :class="[
      sizeClass,
      'inline-flex shrink-0 items-center justify-center rounded-full bg-app-surface-elevated text-[0.55rem] font-bold text-app-muted',
      imgClass,
    ]"
    aria-hidden="true"
  >
    {{ (code ?? alt).slice(0, 2).toUpperCase() }}
  </span>
</template>
