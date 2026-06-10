<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ChevronRight, LogOut, Settings, Shield } from '@lucide/vue'
import UserPredictionsList from '@/components/predictions/UserPredictionsList.vue'
import { useAuthStore } from '@/stores/authStore'
import { usePredictionStore } from '@/stores/predictionStore'
import type { PredictionWithMatch } from '@/types'

const auth = useAuthStore()
const predictions = usePredictionStore()
const router = useRouter()
const loggingOut = ref(false)
const loadingPredictions = ref(false)
const userPredictions = ref<PredictionWithMatch[]>([])

onMounted(async () => {
  if (!auth.user) return
  await auth.fetchProfile(auth.user.id)
  loadingPredictions.value = true
  try {
    userPredictions.value = await predictions.fetchUserPredictions(auth.user.id)
  } finally {
    loadingPredictions.value = false
  }
})

async function handleLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    await router.push('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">Mi perfil</h1>

    <div class="mb-6 flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <img
        v-if="auth.profile?.avatar"
        :src="auth.profile.avatar"
        :alt="auth.profile.username ?? 'Usuario'"
        class="mb-4 h-24 w-24 rounded-full border-2 border-mundial-accent/40"
      />
      <span
        v-else
        class="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-bold text-slate-300"
      >
        {{ auth.profile?.username?.[0]?.toUpperCase() ?? auth.user?.email?.[0]?.toUpperCase() ?? '?' }}
      </span>

      <p class="text-xl font-semibold">
        {{ auth.profile?.username ?? 'Jugador' }}
      </p>
      <p v-if="auth.user?.email" class="mt-1 text-sm text-slate-400">
        {{ auth.user.email }}
      </p>
    </div>

    <div class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-5 text-center">
      <p class="text-xs text-slate-400">Puntos acumulados</p>
      <p class="text-4xl font-bold tabular-nums text-mundial-accent">
        {{ auth.profile?.points ?? 0 }}
      </p>
      <RouterLink to="/ranking" class="mt-2 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline">
        Ver ranking
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <UserPredictionsList
      class="mb-6"
      :predictions="userPredictions"
      :loading="loadingPredictions"
      empty-message="Aún no has hecho predicciones. Elige un partido en inicio y agrega tus goles y marcadores."
    />

    <section class="mb-6 space-y-2">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Accesos rápidos
      </h2>

      <RouterLink
        to="/reglas"
        class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
      >
        <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
          <Settings class="h-4 w-4 text-slate-400" />
          Reglas y pagos
        </span>
        <ChevronRight class="h-4 w-4 text-slate-500" />
      </RouterLink>

      <RouterLink
        v-if="auth.isAdmin"
        to="/admin"
        class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
      >
        <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
          <Shield class="h-4 w-4 text-slate-400" />
          Panel de admin
        </span>
        <ChevronRight class="h-4 w-4 text-slate-500" />
      </RouterLink>
    </section>

    <section>
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Cuenta
      </h2>
      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        :disabled="loggingOut"
        @click="handleLogout"
      >
        <LogOut class="h-4 w-4" />
        {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}
      </button>
    </section>
  </div>
</template>
