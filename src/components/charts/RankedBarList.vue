<script setup lang="ts">
import { computed } from 'vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'

type Row = {
  code: string
  name: string
  subtitle?: string
  value: number
  secondaryValue?: number
}

const props = withDefaults(
  defineProps<{
    rows: Row[]
    primaryColor: string
    secondaryColor?: string
    primaryLabel?: string
    secondaryLabel?: string
    unit?: string
  }>(),
  {
    secondaryColor: undefined,
    primaryLabel: undefined,
    secondaryLabel: undefined,
    unit: '',
  },
)

const isStacked = computed(() => props.rows.some((r) => r.secondaryValue !== undefined))

const maxTotal = computed(() => {
  let max = 0
  for (const row of props.rows) {
    const total = row.value + (row.secondaryValue ?? 0)
    if (total > max) max = total
  }
  return max || 1
})

function pct(value: number): number {
  return Math.max(0, Math.min(100, (value / maxTotal.value) * 100))
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="isStacked && (primaryLabel || secondaryLabel)"
      class="flex flex-wrap gap-4 text-xs text-app-muted"
    >
      <span v-if="primaryLabel" class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: primaryColor }" />
        {{ primaryLabel }}
      </span>
      <span v-if="secondaryLabel" class="inline-flex items-center gap-1.5">
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: secondaryColor }"
        />
        {{ secondaryLabel }}
      </span>
    </div>

    <div v-for="(row, index) in rows" :key="row.code + row.name" class="flex items-center gap-3">
      <span class="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-app-muted">
        {{ index + 1 }}
      </span>
      <TeamFlag :code="row.code" :alt="row.name" size="sm" />
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-app-text">{{ row.name }}</p>
            <p v-if="row.subtitle" class="truncate text-xs text-app-muted">{{ row.subtitle }}</p>
          </div>
          <span class="shrink-0 text-sm font-bold tabular-nums text-app-text">
            {{ row.value + (row.secondaryValue ?? 0) }}{{ unit }}
          </span>
        </div>

        <div class="mt-1.5 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-app-surface-elevated">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: pct(row.value) + '%', backgroundColor: primaryColor }"
          />
          <div
            v-if="row.secondaryValue !== undefined"
            class="h-full rounded-full transition-all"
            :style="{ width: pct(row.secondaryValue) + '%', backgroundColor: secondaryColor }"
          />
        </div>

        <p v-if="row.secondaryValue !== undefined" class="mt-1 text-xs text-app-muted">
          {{ row.value }} {{ primaryLabel?.toLowerCase() ?? '' }} · {{ row.secondaryValue }}
          {{ secondaryLabel?.toLowerCase() ?? '' }}
        </p>
      </div>
    </div>
  </div>
</template>
