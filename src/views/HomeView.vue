<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import { useHomeRealtime } from '@/composables/useHomeRealtime'
import { APP_NAME, APP_TAGLINE } from '@/constants/branding'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import MatchCard from '@/components/shared/MatchCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'

const auth = useAuthStore()
const matchStore = useMatchStore()

useHomeRealtime()

const openForPredictions = computed(() =>
  matchStore.matches.filter((m) => isMatchOpenForPredictions(m)).slice(0, 10),
)
</script>

<template>
  <div>
    <div class="mb-6 lg:mb-8">
      <h1 class="text-2xl font-bold lg:text-3xl">{{ APP_NAME }}</h1>
      <p class="mt-1 text-sm text-slate-400 lg:text-base">
        {{ APP_TAGLINE }} — predice goles y marcadores antes del inicio
      </p>
      <RouterLink
        to="/reglas"
        class="mt-2 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline lg:text-base"
      >
        ${{ ENTRY_FEE_MXN }} MXN por partido · Ver reglas y datos de pago
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 text-center lg:p-6"
    >
      <p class="mb-3 text-sm text-slate-300 lg:text-base">Inicia sesión para guardar tus predicciones</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold lg:px-6 lg:py-2.5"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <div
      class="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0"
      :class="{ 'lg:grid-cols-1': !openForPredictions.length }"
    >
      <section v-if="openForPredictions.length">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent lg:text-base">
          Abiertos para predecir
        </h2>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <MatchCard v-for="match in openForPredictions" :key="match.id" :match="match" show-predict-badge />
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green lg:text-base">
          En vivo
        </h2>

        <p v-if="matchStore.loading" class="text-slate-400">Cargando...</p>

        <div
          v-else-if="!matchStore.liveMatches.length"
          class="rounded-xl border border-dashed border-white/20 p-6 text-center lg:p-8"
        >
          <p class="mb-1 font-medium text-slate-300">Ningún partido en vivo ahora</p>
          <p class="text-sm text-slate-500">
            Los partidos aparecen aquí automáticamente a la hora programada.
          </p>
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="mt-3 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
          >
            Ir al admin
            <ChevronRight class="h-4 w-4" />
          </RouterLink>
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <MatchCard v-for="match in matchStore.liveMatches" :key="match.id" :match="match" />
        </div>
      </section>
    </div>
  </div>
</template>
