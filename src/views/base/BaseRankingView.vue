<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import { BASE_QUINIELA_LOGIC } from '@/constants/base-quiniela-rules'
import { QUINIELA_MODE_BASE } from '@/constants/quiniela-modes'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const baseStore = useBaseQuinielaStore()

onMounted(() => baseStore.fetchRounds())
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Ranking</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ QUINIELA_MODE_BASE.title }} — ranking independiente por jornada
    </p>

    <p class="mb-4 text-sm text-slate-400">{{ BASE_QUINIELA_LOGIC.summary }}</p>

    <p v-if="baseStore.loading" class="text-slate-400">Cargando jornadas...</p>

    <div
      v-else-if="!baseStore.rounds.length"
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      Aún no hay jornadas de quiniela base.
    </div>

    <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="round in baseStore.rounds"
        :key="round.id"
        :to="`/quiniela-base/${round.id}`"
        class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-mundial-green/40"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mundial-green/15 text-sm font-bold text-mundial-green"
        >
          {{ round.round_number }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ round.title }}</p>
          <p class="text-xs text-slate-500">{{ round.match_count }} partidos · ver grilla y ranking</p>
        </div>
        <ChevronRight class="h-4 w-4 text-slate-500" />
      </RouterLink>
    </div>
  </div>
</template>
