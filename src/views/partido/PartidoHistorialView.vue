<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import UserPredictionsList from '@/components/predictions/UserPredictionsList.vue'
import { QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'
import { useAuthStore } from '@/stores/authStore'
import { usePredictionStore } from '@/stores/predictionStore'
import type { PredictionWithMatch } from '@/types'

const auth = useAuthStore()
const predictions = usePredictionStore()
const loading = ref(false)
const userPredictions = ref<PredictionWithMatch[]>([])

onMounted(async () => {
  if (!auth.user) return
  loading.value = true
  try {
    userPredictions.value = await predictions.fetchUserPredictions(auth.user.id)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Historial</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ QUINIELA_MODE_PARTIDO.title }} — tus predicciones por partido
    </p>

    <div
      v-if="!auth.isLoggedIn"
      class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-6 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para ver tu historial</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <template v-else>
      <p v-if="loading" class="text-slate-400">Cargando historial...</p>

      <UserPredictionsList
        v-else
        :predictions="userPredictions"
        empty-message="Aún no tienes predicciones en la quiniela por partido."
      />
    </template>
  </div>
</template>
