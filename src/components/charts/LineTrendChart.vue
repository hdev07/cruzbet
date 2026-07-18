<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContainerWidth } from '@/composables/useContainerWidth'

type Series = {
  key: string
  label: string
  color: string
  values: Array<number | null>
}

const props = withDefaults(
  defineProps<{
    categories: string[]
    series: Series[]
    /** Si es true, el valor más bajo se dibuja arriba (útil para posición en tabla). */
    invertY?: boolean
    unit?: string
    /** Dominio Y fijo, p. ej. [1, 18] para posiciones. Si se omite, se calcula de los datos. */
    yDomain?: [number, number]
  }>(),
  {
    invertY: false,
    unit: '',
    yDomain: undefined,
  },
)

const GUTTER_LEFT = 28
const PADDING_RIGHT = 8
const PADDING_TOP = 16
const CHART_HEIGHT = 130
const LABELS_HEIGHT = 22
const MIN_SLOT = 28

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = useContainerWidth(containerRef)

const svgHeight = PADDING_TOP + CHART_HEIGHT + LABELS_HEIGHT

const slotWidth = computed(() => {
  const n = props.categories.length
  const available = Math.max(0, containerWidth.value - GUTTER_LEFT - PADDING_RIGHT)
  if (n <= 1) return Math.max(MIN_SLOT, available)
  return Math.max(MIN_SLOT, available / (n - 1))
})

const svgWidth = computed(() => {
  const n = props.categories.length
  if (n <= 1) return Math.max(containerWidth.value, GUTTER_LEFT + slotWidth.value + PADDING_RIGHT)
  return GUTTER_LEFT + (n - 1) * slotWidth.value + PADDING_RIGHT
})

function niceCeil(value: number): number {
  if (value <= 0) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

const domain = computed<[number, number]>(() => {
  if (props.yDomain) return props.yDomain
  const all = props.series.flatMap((s) => s.values).filter((v): v is number => v !== null)
  if (!all.length) return [0, 4]
  const max = niceCeil(Math.max(...all))
  const min = Math.min(0, ...all)
  return [min, max]
})

const yTicks = computed(() => {
  const [min, max] = domain.value
  return [min, (min + max) / 2, max]
})

function yFor(value: number): number {
  const [min, max] = domain.value
  const range = max - min || 1
  const ratio = (value - min) / range
  return props.invertY
    ? PADDING_TOP + ratio * CHART_HEIGHT
    : PADDING_TOP + CHART_HEIGHT - ratio * CHART_HEIGHT
}

function xFor(index: number): number {
  return GUTTER_LEFT + index * slotWidth.value
}

function linePath(series: Series): string {
  const points = series.values
    .map((value, index) => (value === null ? null : `${xFor(index)},${yFor(value)}`))
    .filter((point): point is string => point !== null)
  if (points.length < 2) return ''
  return `M ${points.join(' L ')}`
}

const hovered = ref<number | null>(null)

function selectIndex(index: number) {
  hovered.value = hovered.value === index ? null : index
}

function onPointerEnter(index: number, event: PointerEvent) {
  if (event.pointerType === 'mouse') hovered.value = index
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') hovered.value = null
}

const tooltip = computed(() => {
  const index = hovered.value
  if (index === null) return null
  const lines = props.series
    .filter((s) => s.values[index] !== null && s.values[index] !== undefined)
    .map((s) => ({ label: s.label, value: s.values[index] as number, color: s.color }))
  if (!lines.length) return null

  const boxWidth = 96
  const lineHeight = 13
  const boxHeight = 18 + lines.length * lineHeight
  let tx = xFor(index) - boxWidth / 2
  tx = Math.max(2, Math.min(svgWidth.value - boxWidth - 2, tx))
  const topY = Math.min(...lines.map((l) => yFor(l.value)))
  let ty = topY - boxHeight - 8
  ty = Math.max(2, ty)
  return { x: tx, y: ty, width: boxWidth, height: boxHeight, category: props.categories[index] ?? '', lines }
})
</script>

<template>
  <div class="w-full">
    <div v-if="series.length > 1" class="mb-2 flex flex-wrap gap-3 text-xs text-app-muted">
      <span v-for="s in series" :key="s.key" class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
        {{ s.label }}
      </span>
    </div>

    <div ref="containerRef" class="w-full overflow-x-auto app-scrollbar">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="block max-w-none"
        role="img"
        :aria-label="`Gráfica de línea: ${series.map((s) => s.label).join(', ')}`"
      >
        <g>
          <line
            v-for="(tick, i) in yTicks"
            :key="`grid-${i}`"
            :x1="GUTTER_LEFT"
            :x2="svgWidth - PADDING_RIGHT"
            :y1="yFor(tick)"
            :y2="yFor(tick)"
            stroke="var(--theme-border)"
            stroke-width="1"
            opacity="0.45"
          />
          <text
            v-for="(tick, i) in yTicks"
            :key="`tick-${i}`"
            :x="GUTTER_LEFT - 6"
            :y="yFor(tick) + 3"
            text-anchor="end"
            fill="var(--theme-muted)"
            font-size="9"
          >
            {{ Math.round(tick) }}
          </text>
        </g>

        <g v-for="(category, ci) in categories" :key="`hit-${ci}`">
          <rect
            v-if="hovered === ci"
            :x="xFor(ci) - slotWidth / 2"
            :y="PADDING_TOP"
            :width="slotWidth"
            :height="CHART_HEIGHT"
            fill="var(--theme-hover)"
            rx="4"
          />
          <rect
            :x="xFor(ci) - slotWidth / 2"
            :y="PADDING_TOP"
            :width="slotWidth"
            :height="CHART_HEIGHT"
            fill="transparent"
            class="cursor-pointer"
            @pointerenter="onPointerEnter(ci, $event)"
            @pointerleave="onPointerLeave($event)"
            @click="selectIndex(ci)"
          />
          <text
            :x="xFor(ci)"
            :y="PADDING_TOP + CHART_HEIGHT + 14"
            text-anchor="middle"
            fill="var(--theme-muted)"
            font-size="9"
          >
            {{ category }}
          </text>
        </g>

        <g v-for="s in series" :key="`line-${s.key}`" style="pointer-events: none">
          <path :d="linePath(s)" fill="none" :stroke="s.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <circle
            v-for="(value, index) in s.values"
            v-show="value !== null"
            :key="`dot-${s.key}-${index}`"
            :cx="xFor(index)"
            :cy="value === null ? 0 : yFor(value)"
            r="2.5"
            :fill="s.color"
          />
        </g>

        <g v-if="tooltip" style="pointer-events: none">
          <rect
            :x="tooltip.x"
            :y="tooltip.y"
            :width="tooltip.width"
            :height="tooltip.height"
            rx="6"
            fill="var(--theme-surface-elevated)"
            stroke="var(--theme-border)"
            stroke-width="1"
          />
          <text :x="tooltip.x + 8" :y="tooltip.y + 13" fill="var(--theme-text)" font-size="9" font-weight="700">
            {{ tooltip.category }}
          </text>
          <g v-for="(line, li) in tooltip.lines" :key="`tt-${li}`">
            <circle :cx="tooltip.x + 10" :cy="tooltip.y + 24 + li * 13" r="2.5" :fill="line.color" />
            <text :x="tooltip.x + 16" :y="tooltip.y + 27 + li * 13" fill="var(--theme-muted)" font-size="8.5">
              {{ line.label }}: <tspan fill="var(--theme-text)" font-weight="700">{{ line.value }}{{ unit }}</tspan>
            </text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>
