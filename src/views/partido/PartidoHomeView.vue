<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import MatchCard from '@/components/shared/MatchCard.vue'
import { useHomeRealtime } from '@/composables/useHomeRealtime'
import { QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import { useAuthStore } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'

const auth = useAuthStore()
const matchStore = useMatchStore()
const { participantCounts } = useHomeRealtime()

onMounted(async () => {
  if (!matchStore.matches.length) {
    await Promise.all([matchStore.fetchMatches(), matchStore.fetchLiveMatches()])
  }
})

const openForPredictions = computed(() =>
  matchStore.matches.filter((m) => isMatchOpenForPredictions(m)),
)
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <div class="mb-6">
      <h1 class="text-2xl font-bold lg:text-3xl">Partidos</h1>
      <p class="mt-1 text-sm text-slate-400">
        {{ QUINIELA_MODE_PARTIDO.entryLabel }} · minuto del primer gol + L/E/V
      </p>
      <RouterLink
        to="/quiniela-partido/reglas"
        class="mt-2 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        Ver reglas y datos de pago
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para guardar tus predicciones</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <div class="space-y-8">
      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Abiertos para predecir
        </h2>

        <p v-if="matchStore.loading" class="text-slate-400">Cargando partidos...</p>

        <div
          v-else-if="!openForPredictions.length"
          class="rounded-xl border border-dashed border-white/20 p-6 text-center text-slate-400"
        >
          No hay partidos abiertos ahora. Vuelve más tarde.
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <MatchCard
            v-for="match in openForPredictions"
            :key="match.id"
            :match="match"
            :participant-count="participantCounts[match.id] ?? 0"
            show-predict-badge
          />
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
          En vivo
        </h2>

        <div
          v-if="!matchStore.liveMatches.length"
          class="rounded-xl border border-dashed border-white/20 p-6 text-center"
        >
          <p class="mb-1 font-medium text-slate-300">Ningún partido en vivo ahora</p>
          <p class="text-sm text-slate-500">
            Los partidos aparecen aquí automáticamente a la hora programada.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <MatchCard
            v-for="match in matchStore.liveMatches"
            :key="match.id"
            :match="match"
            :participant-count="participantCounts[match.id] ?? 0"
          />
        </div>
      </section>
    </div>
  </div>
</template>
