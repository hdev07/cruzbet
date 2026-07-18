<script setup lang="ts">
import { computed } from 'vue'

type Axis = { key: string; label: string; value: number; rawLabel?: string }
type Series = { key: string; label: string; color: string; axes: Axis[] }

const props = defineProps<{
  /** Etiquetas de los ejes, en orden (comparten posición angular entre series). */
  labels: string[]
  series: Series[]
}>()

const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 82
const RINGS = [0.25, 0.5, 0.75, 1]

const axisCount = computed(() => props.labels.length || 1)

function angleFor(index: number): number {
  return (Math.PI * 2 * index) / axisCount.value - Math.PI / 2
}

function pointFor(index: number, ratio: number): { x: number; y: number } {
  const angle = angleFor(index)
  const r = RADIUS * Math.max(0, Math.min(1, ratio))
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
}

function ringPath(ratio: number): string {
  const points = props.labels.map((_, index) => pointFor(index, ratio))
  return `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')} Z`
}

function seriesPath(series: Series): string {
  const points = props.labels.map((label, index) => {
    const axis = series.axes.find((a) => a.label === label)
    return pointFor(index, (axis?.value ?? 0) / 100)
  })
  return `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')} Z`
}

function labelPoint(index: number) {
  const { x, y } = pointFor(index, 1.22)
  return { x, y }
}

function anchorFor(index: number): 'start' | 'middle' | 'end' {
  const angle = angleFor(index)
  const cos = Math.cos(angle)
  if (cos > 0.3) return 'start'
  if (cos < -0.3) return 'end'
  return 'middle'
}
</script>

<template>
  <div class="w-full">
    <div v-if="series.length > 1" class="mb-2 flex flex-wrap gap-4 text-xs text-app-muted">
      <span v-for="s in series" :key="s.key" class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
        {{ s.label }}
      </span>
    </div>

    <div class="flex justify-center">
      <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" aria-label="Radar de rendimiento">
        <g>
          <path
            v-for="ring in RINGS"
            :key="`ring-${ring}`"
            :d="ringPath(ring)"
            fill="none"
            stroke="var(--theme-border)"
            stroke-width="1"
            opacity="0.5"
          />
          <line
            v-for="(label, index) in labels"
            :key="`spoke-${label}`"
            :x1="CENTER"
            :y1="CENTER"
            :x2="pointFor(index, 1).x"
            :y2="pointFor(index, 1).y"
            stroke="var(--theme-border)"
            stroke-width="1"
            opacity="0.5"
          />
        </g>

        <g v-for="s in series" :key="`series-${s.key}`">
          <path :d="seriesPath(s)" :fill="s.color" fill-opacity="0.18" :stroke="s.color" stroke-width="2" stroke-linejoin="round" />
          <circle
            v-for="(label, index) in labels"
            :key="`dot-${s.key}-${label}`"
            :cx="pointFor(index, (s.axes.find((a) => a.label === label)?.value ?? 0) / 100).x"
            :cy="pointFor(index, (s.axes.find((a) => a.label === label)?.value ?? 0) / 100).y"
            r="2.5"
            :fill="s.color"
          />
        </g>

        <text
          v-for="(label, index) in labels"
          :key="`label-${label}`"
          :x="labelPoint(index).x"
          :y="labelPoint(index).y"
          :text-anchor="anchorFor(index)"
          dominant-baseline="middle"
          fill="var(--theme-muted)"
          font-size="9.5"
        >
          {{ label }}
        </text>
      </svg>
    </div>
  </div>
</template>
