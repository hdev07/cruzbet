<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { detectQuinielaMode, modeConfig } from '@/constants/quiniela-modes'

const route = useRoute()

const mode = computed(() => detectQuinielaMode(route.path))
const config = computed(() => (mode.value ? modeConfig(mode.value) : null))
const isPartido = computed(() => mode.value === 'partido')
</script>

<template>
  <div
    v-if="config"
    class="mb-6 flex items-center gap-3 rounded-xl border px-4 py-3"
    :class="[config.borderClass, config.bgClass]"
  >
    <RouterLink
      to="/"
      class="flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
      title="Volver al inicio"
    >
      <ArrowLeft class="h-4 w-4" />
    </RouterLink>
    <div class="min-w-0 flex-1">
      <p
        class="text-sm font-semibold"
        :class="isPartido ? 'text-mundial-accent' : 'text-mundial-green'"
      >
        {{ config.title }}
      </p>
      <p class="text-xs text-slate-400">{{ config.entryLabel }} · {{ config.tagline }}</p>
    </div>
  </div>
</template>
