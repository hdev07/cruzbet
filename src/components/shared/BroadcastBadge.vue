<script setup lang="ts">
import { computed } from 'vue'
import { parseBroadcastChannels } from '@/lib/matchBroadcast'

const props = withDefaults(
  defineProps<{
    channels?: string | null
    max?: number
  }>(),
  {
    channels: null,
    max: 2,
  },
)

const items = computed(() => parseBroadcastChannels(props.channels).slice(0, props.max))
</script>

<template>
  <span v-if="items.length" class="inline-flex shrink-0 items-center gap-1">
    <span
      v-for="item in items"
      :key="item.code"
      class="inline-flex h-4 items-center rounded px-1 text-[9px] font-bold uppercase leading-none tracking-wide"
      :style="{ backgroundColor: item.bg, color: item.color }"
      :title="item.label"
    >
      {{ item.label }}
    </span>
  </span>
</template>
