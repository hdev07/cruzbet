<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div
    class="animate-pulse rounded-lg bg-white/10"
    v-bind="$attrs"
    aria-hidden="true"
  />
</template>
