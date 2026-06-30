<script setup lang="ts">
import { computed } from 'vue'
import {
  displayRegulationScore,
  hasPenaltyShootout,
  penaltyShootoutLabel,
} from '@/lib/matchScoreDisplay'
import type { Match } from '@/types'

const props = withDefaults(
  defineProps<{
    match: Match
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const regulation = computed(() => displayRegulationScore(props.match))
const penaltyLabel = computed(() => penaltyShootoutLabel(props.match))
const showPenalties = computed(() => hasPenaltyShootout(props.match))

const scoreClass = computed(() => {
  if (props.size === 'sm') return 'text-lg sm:text-xl'
  if (props.size === 'lg') return 'text-3xl sm:text-4xl'
  return 'text-lg font-bold sm:text-xl'
})
</script>

<template>
  <div class="text-center">
    <p class="font-bold tabular-nums tracking-tight" :class="scoreClass">
      {{ regulation.home }}
      <span class="mx-1 font-normal text-slate-500">-</span>
      {{ regulation.away }}
    </p>
    <p
      v-if="showPenalties && penaltyLabel"
      class="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-400 sm:text-xs"
    >
      {{ penaltyLabel }}
    </p>
  </div>
</template>
