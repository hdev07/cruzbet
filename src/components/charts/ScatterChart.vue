<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContainerWidth } from '@/composables/useContainerWidth'

type Point = { label: string; x: number; y: number }

const props = withDefaults(
  defineProps<{
    points: Point[]
    xLabel: string
    yLabel: string
    color?: string
    xDomain?: [number, number]
    yDomain?: [number, number]
  }>(),
  {
    color: 'var(--color-mundial-accent)',
    xDomain: undefined,
    yDomain: undefined,
  },
)

const HEIGHT = 180
const PADDING_LEFT = 32
const PADDING_BOTTOM = 28
const PADDING_TOP = 10
const PADDING_RIGHT = 12

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = useContainerWidth(containerRef, 280)

const width = computed(() => Math.max(220, containerWidth.value))

function domainFor(values: number[], override?: [number, number]): [number, number] {
  if (override) return override
  if (!values.length) return [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.1 || 1
  return [min - pad, max + pad]
}

const xDomain = computed(() => domainFor(props.points.map((p) => p.x), props.xDomain))
const yDomain = computed(() => domainFor(props.points.map((p) => p.y), props.yDomain))

function xFor(value: number): number {
  const [min, max] = xDomain.value
  const ratio = (value - min) / (max - min || 1)
  return PADDING_LEFT + ratio * (width.value - PADDING_LEFT - PADDING_RIGHT)
}

function yFor(value: number): number {
  const [min, max] = yDomain.value
  const ratio = (value - min) / (max - min || 1)
  return HEIGHT - PADDING_BOTTOM - ratio * (HEIGHT - PADDING_BOTTOM - PADDING_TOP)
}

const xTicks = computed(() => {
  const [min, max] = xDomain.value
  return [min, (min + max) / 2, max]
})
const yTicks = computed(() => {
  const [min, max] = yDomain.value
  return [min, (min + max) / 2, max]
})
</script>

<template>
  <div class="w-full">
    <div ref="containerRef" class="w-full">
      <svg
        :width="width"
        :height="HEIGHT"
        :viewBox="`0 0 ${width} ${HEIGHT}`"
        class="block max-w-full"
        role="img"
        :aria-label="`Dispersión ${xLabel} vs ${yLabel}`"
      >
        <g>
          <line
            v-for="(tick, i) in yTicks"
            :key="`ygrid-${i}`"
            :x1="PADDING_LEFT"
            :x2="width - PADDING_RIGHT"
            :y1="yFor(tick)"
            :y2="yFor(tick)"
            stroke="var(--theme-border)"
            stroke-width="1"
            opacity="0.4"
          />
          <text
            v-for="(tick, i) in yTicks"
            :key="`ytick-${i}`"
            :x="PADDING_LEFT - 4"
            :y="yFor(tick) + 3"
            text-anchor="end"
            fill="var(--theme-muted)"
            font-size="8.5"
          >
            {{ Math.round(tick * 10) / 10 }}
          </text>
          <text
            v-for="(tick, i) in xTicks"
            :key="`xtick-${i}`"
            :x="xFor(tick)"
            :y="HEIGHT - PADDING_BOTTOM + 14"
            text-anchor="middle"
            fill="var(--theme-muted)"
            font-size="8.5"
          >
            {{ Math.round(tick * 10) / 10 }}
          </text>
        </g>

        <line
          :x1="PADDING_LEFT"
          :x2="width - PADDING_RIGHT"
          :y1="HEIGHT - PADDING_BOTTOM"
          :y2="HEIGHT - PADDING_BOTTOM"
          stroke="var(--theme-border)"
          stroke-width="1"
        />
        <line
          :x1="PADDING_LEFT"
          :x2="PADDING_LEFT"
          :y1="PADDING_TOP"
          :y2="HEIGHT - PADDING_BOTTOM"
          stroke="var(--theme-border)"
          stroke-width="1"
        />

        <circle
          v-for="point in points"
          :key="point.label"
          :cx="xFor(point.x)"
          :cy="yFor(point.y)"
          r="4"
          :fill="color"
          fill-opacity="0.75"
          :stroke="color"
          stroke-width="1"
        >
          <title>{{ point.label }}: {{ xLabel }} {{ point.x }}, {{ yLabel }} {{ point.y }}</title>
        </circle>

        <text :x="width / 2" :y="HEIGHT - 4" text-anchor="middle" fill="var(--theme-muted)" font-size="9">
          {{ xLabel }}
        </text>
        <text
          :x="11"
          :y="HEIGHT / 2"
          text-anchor="middle"
          fill="var(--theme-muted)"
          font-size="9"
          :transform="`rotate(-90, 11, ${HEIGHT / 2})`"
        >
          {{ yLabel }}
        </text>
      </svg>
    </div>
  </div>
</template>
