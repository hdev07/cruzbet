<script setup lang="ts">
import { RouterView } from 'vue-router'
import { usePageMeta } from '@/composables/usePageMeta'
import MobileLayout from '@/layouts/MobileLayout.vue'

usePageMeta()
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <MobileLayout v-if="route.meta.layout !== 'blank'">
      <component :is="Component" />
    </MobileLayout>
    <component :is="Component" v-else />
  </RouterView>
</template>
