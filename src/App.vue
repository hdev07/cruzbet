<script setup lang="ts">
import { RouterView } from 'vue-router'
import { usePageMeta } from '@/composables/usePageMeta'
import UpdatePrompt from '@/components/shared/UpdatePrompt.vue'
import AppLayout from '@/layouts/AppLayout.vue'

usePageMeta()
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <AppLayout v-if="route.meta.layout !== 'blank'">
      <component :is="Component" />
    </AppLayout>
    <component :is="Component" v-else />
  </RouterView>
  <UpdatePrompt />
</template>
