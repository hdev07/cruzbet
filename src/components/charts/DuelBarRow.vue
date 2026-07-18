<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    homeValue: number | null
    awayValue: number | null
    unit?: string
    homeColor?: string
    awayColor?: string
  }>(),
  {
    unit: '',
    homeColor: 'var(--color-mundial-accent)',
    awayColor: 'var(--color-mundial-error)',
  },
)

const scale = computed(() => Math.max(props.homeValue ?? 0, props.awayValue ?? 0, 1))
const homePct = computed(() => Math.max(0, Math.min(100, ((props.homeValue ?? 0) / scale.value) * 100)))
const awayPct = computed(() => Math.max(0, Math.min(100, ((props.awayValue ?? 0) / scale.value) * 100)))
</script>

<template>
  <div class="grid grid-cols-[3rem_1fr_1fr_3rem] items-center gap-2 py-1.5 text-xs">
    <span class="text-right font-semibold tabular-nums text-app-text">
      {{ homeValue ?? '–' }}{{ unit }}
    </span>
    <div class="flex h-2 justify-end overflow-hidden rounded-l-full bg-app-surface-elevated">
      <div class="h-full rounded-l-full transition-all" :style="{ width: homePct + '%', backgroundColor: homeColor }" />
    </div>
    <div class="flex h-2 overflow-hidden rounded-r-full bg-app-surface-elevated">
      <div class="h-full rounded-r-full transition-all" :style="{ width: awayPct + '%', backgroundColor: awayColor }" />
    </div>
    <span class="text-left font-semibold tabular-nums text-app-text">
      {{ awayValue ?? '–' }}{{ unit }}
    </span>
  </div>
  <p class="mb-1 text-center text-[10px] uppercase tracking-wide text-app-muted">{{ label }}</p>
</template>
