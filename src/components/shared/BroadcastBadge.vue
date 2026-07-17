<script setup lang="ts">
import { computed } from 'vue'
import BroadcastLogo from '@/components/shared/BroadcastLogo.vue'
import { parseBroadcastChannels } from '@/lib/matchBroadcast'

const props = withDefaults(
  defineProps<{
    channels?: string | null
    max?: number
    size?: 'sm' | 'md'
  }>(),
  {
    channels: null,
    max: 2,
    size: 'sm',
  },
)

const items = computed(() => parseBroadcastChannels(props.channels).slice(0, props.max))
</script>

<template>
  <span v-if="items.length" class="inline-flex shrink-0 items-center gap-1">
    <BroadcastLogo v-for="item in items" :key="item.code" :code="item.code" :size="size" />
  </span>
</template>
