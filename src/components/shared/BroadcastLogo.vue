<script setup lang="ts">
import { computed } from 'vue'
import azteca from '@/assets/broadcast-logos/azteca.svg'
import canal5 from '@/assets/broadcast-logos/canal5.svg'
import claro from '@/assets/broadcast-logos/claro.svg'
import disney from '@/assets/broadcast-logos/disney.svg'
import espn from '@/assets/broadcast-logos/espn.svg'
import fox from '@/assets/broadcast-logos/fox.svg'
import foxone from '@/assets/broadcast-logos/foxone.svg'
import prime from '@/assets/broadcast-logos/prime.svg'
import tudn from '@/assets/broadcast-logos/tudn.svg'
import vix from '@/assets/broadcast-logos/vix.svg'
import { parseBroadcastChannels } from '@/lib/matchBroadcast'

const props = withDefaults(
  defineProps<{
    code: string
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'sm',
  },
)

/** Logos SVG oficiales de cada señal (Wikimedia Commons). */
const LOGOS: Record<string, string> = {
  espn,
  tudn,
  canal5,
  vix,
  fox,
  foxone,
  azteca,
  prime,
  claro,
  disney,
}

const info = computed(() => parseBroadcastChannels(props.code)[0] ?? null)
const logoSrc = computed(() => (info.value ? LOGOS[info.value.code] ?? null : null))
</script>

<template>
  <span
    v-if="logoSrc"
    class="inline-flex shrink-0 items-center justify-center rounded-md bg-white px-1.5 ring-1 ring-black/10"
    :class="size === 'md' ? 'h-6' : 'h-5'"
    :title="info?.label"
  >
    <img
      :src="logoSrc"
      :alt="info?.label"
      class="w-auto object-contain"
      :class="size === 'md' ? 'h-3.5' : 'h-3'"
    />
  </span>
  <span
    v-else-if="info"
    class="inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[9px] font-bold uppercase leading-none tracking-wide"
    :style="{ backgroundColor: info.bg, color: info.color }"
  >
    {{ info.label }}
  </span>
</template>
