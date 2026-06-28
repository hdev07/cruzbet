<script setup lang="ts">
defineProps<{
  src: string | null | undefined
  alt: string
  imgClass?: string
}>()
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    decoding="async"
  />
</template>
