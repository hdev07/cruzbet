<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div
    class="live-pulse-track overflow-hidden"
    :class="compact ? 'h-0.5' : 'h-1'"
    aria-hidden="true"
  >
    <div class="live-pulse-bar" />
  </div>
</template>
