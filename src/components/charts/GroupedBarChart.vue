<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContainerWidth } from '@/composables/useContainerWidth'

type Series = {
  key: string
  label: string
  color: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    categories: string[]
    series: Series[]
    /** Índice resaltado de forma persistente (p. ej. jornada seleccionada). */
    selectedIndex?: number | null
    unit?: string
  }>(),
  {
    selectedIndex: null,
    unit: '',
  },
)

const emit = defineEmits<{ select: [index: number] }>()

const GUTTER_LEFT = 28
const PADDING_RIGHT = 8
const PADDING_TOP = 24
const CHART_HEIGHT = 120
const LABELS_HEIGHT = 22
const MIN_SLOT = 32
const BAR_GAP = 3
const GROUP_GAP = 8

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = useContainerWidth(containerRef)

const svgHeight = PADDING_TOP + CHART_HEIGHT + LABELS_HEIGHT

const slotWidth = computed(() => {
  const n = Math.max(1, props.categories.length)
  const available = Math.max(0, containerWidth.value - GUTTER_LEFT - PADDING_RIGHT)
  return Math.max(MIN_SLOT, available / n)
})

const svgWidth = computed(
  () => GUTTER_LEFT + props.categories.length * slotWidth.value + PADDING_RIGHT,
)

function niceCeil(value: number): number {
  if (value <= 0) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

const maxValue = computed(() => {
  let max = 0
  for (const s of props.series) {
    for (const v of s.values) if (v > max) max = v
  }
  return niceCeil(max)
})

const yTicks = computed(() => {
  const max = maxValue.value
  return [0, max / 2, max]
})

function yFor(value: number): number {
  const max = maxValue.value || 1
  return PADDING_TOP + CHART_HEIGHT - (value / max) * CHART_HEIGHT
}

const barW = computed(() => {
  const count = props.series.length || 1
  const available = slotWidth.value - GROUP_GAP - BAR_GAP * (count - 1)
  return Math.max(4, Math.min(28, available / count))
})

function barX(categoryIndex: number, seriesIndex: number): number {
  const count = props.series.length || 1
  const groupWidth = barW.value * count + BAR_GAP * (count - 1)
  const groupStart = GUTTER_LEFT + categoryIndex * slotWidth.value + (slotWidth.value - groupWidth) / 2
  return groupStart + seriesIndex * (barW.value + BAR_GAP)
}

function barPath(categoryIndex: number, seriesIndex: number): string {
  const value = props.series[seriesIndex]?.values[categoryIndex] ?? 0
  const baseline = PADDING_TOP + CHART_HEIGHT
  const top = yFor(value)
  const height = Math.max(0, baseline - top)
  if (height <= 0) return ''
  const x = barX(categoryIndex, seriesIndex)
  const width = barW.value
  const radius = Math.min(4, width / 2, height)
  if (height <= radius) {
    return `M ${x},${baseline} L ${x},${baseline - height} L ${x + width},${baseline - height} L ${x + width},${baseline} Z`
  }
  return [
    `M ${x},${baseline}`,
    `L ${x},${top + radius}`,
    `Q ${x},${top} ${x + radius},${top}`,
    `L ${x + width - radius},${top}`,
    `Q ${x + width},${top} ${x + width},${top + radius}`,
    `L ${x + width},${baseline}`,
    'Z',
  ].join(' ')
}

const hovered = ref<number | null>(null)
const activeIndex = computed(() => hovered.value ?? props.selectedIndex ?? null)

function selectIndex(index: number) {
  hovered.value = hovered.value === index ? null : index
  emit('select', index)
}

function onPointerEnter(index: number, event: PointerEvent) {
  if (event.pointerType === 'mouse') hovered.value = index
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') hovered.value = null
}

const tooltip = computed(() => {
  const index = activeIndex.value
  if (index === null) return null
  const lines = props.series.map((s) => ({
    label: s.label,
    value: s.values[index] ?? 0,
    color: s.color,
  }))
  const boxWidth = 92
  const lineHeight = 13
  const boxHeight = 18 + lines.length * lineHeight
  const groupCenter = GUTTER_LEFT + index * slotWidth.value + slotWidth.value / 2
  let tx = groupCenter - boxWidth / 2
  tx = Math.max(2, Math.min(svgWidth.value - boxWidth - 2, tx))
  const highestBarTop = Math.min(
    ...props.series.map((s) => yFor(s.values[index] ?? 0)),
    PADDING_TOP + CHART_HEIGHT,
  )
  let ty = highestBarTop - boxHeight - 6
  ty = Math.max(2, ty)
  return {
    x: tx,
    y: ty,
    width: boxWidth,
    height: boxHeight,
    category: props.categories[index] ?? '',
    lines,
  }
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
        :aria-label="`Gráfica de barras: ${series.map((s) => s.label).join(', ')}`"
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
            :opacity="tick === 0 ? 0.9 : 0.45"
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

        <g v-for="(category, ci) in categories" :key="`cat-${ci}`">
          <rect
            v-if="activeIndex === ci"
            :x="GUTTER_LEFT + ci * slotWidth"
            :y="PADDING_TOP"
            :width="slotWidth"
            :height="CHART_HEIGHT"
            fill="var(--theme-hover)"
            rx="4"
          />
          <rect
            :x="GUTTER_LEFT + ci * slotWidth"
            :y="PADDING_TOP"
            :width="slotWidth"
            :height="CHART_HEIGHT"
            fill="transparent"
            class="cursor-pointer"
            @pointerenter="onPointerEnter(ci, $event)"
            @pointerleave="onPointerLeave($event)"
            @click="selectIndex(ci)"
          />
          <path
            v-for="(s, si) in series"
            :key="`bar-${ci}-${si}`"
            :d="barPath(ci, si)"
            :fill="s.color"
            style="pointer-events: none"
          />
          <text
            :x="GUTTER_LEFT + ci * slotWidth + slotWidth / 2"
            :y="PADDING_TOP + CHART_HEIGHT + 14"
            text-anchor="middle"
            fill="var(--theme-muted)"
            font-size="9"
          >
            {{ category }}
          </text>
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
          <text
            :x="tooltip.x + 8"
            :y="tooltip.y + 13"
            fill="var(--theme-text)"
            font-size="9"
            font-weight="700"
          >
            {{ tooltip.category }}
          </text>
          <g v-for="(line, li) in tooltip.lines" :key="`tt-${li}`">
            <circle
              :cx="tooltip.x + 10"
              :cy="tooltip.y + 24 + li * 13"
              r="2.5"
              :fill="line.color"
            />
            <text
              :x="tooltip.x + 16"
              :y="tooltip.y + 27 + li * 13"
              fill="var(--theme-muted)"
              font-size="8.5"
            >
              {{ line.label }}: <tspan fill="var(--theme-text)" font-weight="700">{{ line.value }}{{ unit }}</tspan>
            </text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>
