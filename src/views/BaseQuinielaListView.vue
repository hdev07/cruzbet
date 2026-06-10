<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_LOGIC,
  BASE_QUINIELA_MATCHES_PER_ROUND,
} from '@/constants/base-quiniela-rules'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()

onMounted(async () => {
  await baseStore.fetchRounds()
})

const roundCount = computed(() => baseStore.rounds.length)
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <div class="mb-6">
      <h1 class="text-2xl font-bold lg:text-3xl">Jornadas</h1>
      <p class="mt-1 text-sm text-slate-400 lg:text-base">
        ${{ BASE_ENTRY_FEE_MXN }} MXN por jornada · {{ BASE_QUINIELA_MATCHES_PER_ROUND }} partidos · grilla L/E/V
      </p>
    </div>

    <div class="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
      <p class="mb-2 font-semibold text-slate-300">Resumen</p>
      <p>{{ BASE_QUINIELA_LOGIC.summary }}</p>
      <RouterLink
        to="/quiniela-base/reglas"
        class="mt-3 inline-flex items-center gap-1 text-mundial-green hover:underline"
      >
        Ver reglas y datos de pago
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-6 rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-4 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para llenar tu quiniela base</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-green px-4 py-2 text-sm font-semibold text-mundial-dark"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <p v-if="baseStore.loading" class="text-slate-400">Cargando jornadas...</p>

    <div
      v-else-if="!roundCount"
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      <p class="mb-1 font-semibold text-slate-300">Sin jornadas aún</p>
      <p class="text-sm">
        Las jornadas se generan agrupando los partidos de {{ BASE_QUINIELA_MATCHES_PER_ROUND }} en
        {{ BASE_QUINIELA_MATCHES_PER_ROUND }}, en orden de calendario.
      </p>
    </div>

    <div v-else class="space-y-3 lg:max-w-2xl">
      <RouterLink
        v-for="round in baseStore.rounds"
        :key="round.id"
        :to="`/quiniela-base/${round.id}`"
        class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-mundial-green/40 hover:bg-mundial-green/5"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mundial-green/15 text-lg font-bold text-mundial-green"
        >
          {{ round.round_number }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-slate-200">{{ round.title }}</p>
          <p class="text-xs text-slate-500">
            {{ round.match_count }} partidos · ${{ BASE_ENTRY_FEE_MXN }} MXN
          </p>
        </div>
        <ChevronRight class="h-5 w-5 shrink-0 text-slate-500" />
      </RouterLink>
    </div>
  </div>
</template>
