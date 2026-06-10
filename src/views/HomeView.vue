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
    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ APP_NAME }}</h1>
      <p class="text-sm text-slate-400">{{ APP_TAGLINE }} — predice goles y marcadores antes del inicio</p>
      <RouterLink
        to="/reglas"
        class="mt-2 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        ${{ ENTRY_FEE_MXN }} MXN por partido · Ver reglas y datos de pago
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para guardar tus predicciones</p>
      <RouterLink to="/login" class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold">
        Entrar con Google
      </RouterLink>
    </div>

    <section v-if="openForPredictions.length" class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        Abiertos para predecir
      </h2>
      <div class="space-y-3">
        <MatchCard v-for="match in openForPredictions" :key="match.id" :match="match" show-predict-badge />
      </div>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        En vivo
      </h2>

      <p v-if="matchStore.loading" class="text-slate-400">Cargando...</p>

      <div
        v-else-if="!matchStore.liveMatches.length"
        class="rounded-xl border border-dashed border-white/20 p-6 text-center"
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

      <div v-else class="space-y-3">
        <MatchCard v-for="match in matchStore.liveMatches" :key="match.id" :match="match" />
      </div>
    </section>
  </div>
</template>
