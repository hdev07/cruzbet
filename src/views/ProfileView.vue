<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Check, ChevronRight, LogOut, Pencil, Settings, Shield, X } from '@lucide/vue'
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
const editingUsername = ref(false)
const usernameDraft = ref('')
const savingUsername = ref(false)
const usernameError = ref<string | null>(null)

watch(
  () => auth.profile?.username,
  (username) => {
    if (!editingUsername.value) {
      usernameDraft.value = username ?? ''
    }
  },
  { immediate: true },
)

function startEditingUsername() {
  usernameDraft.value = auth.profile?.username ?? ''
  usernameError.value = null
  editingUsername.value = true
}

function cancelEditingUsername() {
  usernameDraft.value = auth.profile?.username ?? ''
  usernameError.value = null
  editingUsername.value = false
}

async function saveUsername() {
  usernameError.value = null
  savingUsername.value = true
  try {
    await auth.updateUsername(usernameDraft.value)
    editingUsername.value = false
  } catch (err) {
    usernameError.value = err instanceof Error ? err.message : 'No se pudo guardar el nombre'
  } finally {
    savingUsername.value = false
  }
}

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
    <h1 class="mb-6 text-2xl font-bold lg:text-3xl">Mi perfil</h1>

    <div class="mb-6 grid gap-6 lg:grid-cols-2">
    <div class="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-6 text-center lg:p-8">
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

      <div v-if="editingUsername" class="mt-1 w-full max-w-xs space-y-2">
        <label class="sr-only" for="profile-username">Nombre de usuario</label>
        <input
          id="profile-username"
          v-model="usernameDraft"
          type="text"
          maxlength="30"
          autocomplete="nickname"
          class="w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2 text-center text-base font-semibold"
          :disabled="savingUsername"
          @keyup.enter="saveUsername"
          @keyup.escape="cancelEditingUsername"
        />
        <p v-if="usernameError" class="text-sm text-red-400">{{ usernameError }}</p>
        <div class="flex justify-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg bg-mundial-accent px-3 py-1.5 text-sm font-semibold text-mundial-dark disabled:opacity-50"
            :disabled="savingUsername"
            @click="saveUsername"
          >
            <Check class="h-4 w-4" />
            {{ savingUsername ? 'Guardando...' : 'Guardar' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
            :disabled="savingUsername"
            @click="cancelEditingUsername"
          >
            <X class="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </div>

      <div v-else class="flex items-center gap-2">
        <p class="text-xl font-semibold">
          {{ auth.profile?.username ?? 'Jugador' }}
        </p>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          title="Cambiar nombre"
          @click="startEditingUsername"
        >
          <Pencil class="h-4 w-4" />
        </button>
      </div>

      <p v-if="auth.user?.email" class="mt-1 text-sm text-slate-400">
        {{ auth.user.email }}
      </p>
    </div>

    <div class="flex flex-col items-center justify-center rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-5 text-center lg:p-8">
      <p class="text-xs text-slate-400">Puntos acumulados</p>
      <p class="text-4xl font-bold tabular-nums text-mundial-accent lg:text-5xl">
        {{ auth.profile?.points ?? 0 }}
      </p>
      <RouterLink
        to="/quiniela-partido/ranking"
        class="mt-2 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        Ver ranking por partido
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>
    </div>

    <UserPredictionsList
      class="mb-6"
      :predictions="userPredictions"
      :loading="loadingPredictions"
      title="Historial — quiniela por partido"
      empty-message="Aún no has hecho predicciones. Elige un partido y marca el minuto del primer gol y el ganador."
    />

    <div class="mb-6 flex flex-wrap gap-2">
      <RouterLink
        to="/quiniela-partido/historial"
        class="rounded-lg border border-mundial-accent/30 bg-mundial-accent/10 px-3 py-2 text-sm font-medium text-mundial-accent hover:bg-mundial-accent/20"
      >
        Historial por partido
      </RouterLink>
      <RouterLink
        to="/quiniela-base/historial"
        class="rounded-lg border border-mundial-green/30 bg-mundial-green/10 px-3 py-2 text-sm font-medium text-mundial-green hover:bg-mundial-green/20"
      >
        Historial quiniela base
      </RouterLink>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="space-y-2">
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Accesos rápidos
        </h2>

        <RouterLink
          to="/quiniela-partido/reglas"
          class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
        >
          <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
            <Settings class="h-4 w-4 text-slate-400" />
            Reglas quiniela por partido
          </span>
          <ChevronRight class="h-4 w-4 text-slate-500" />
        </RouterLink>

        <RouterLink
          to="/quiniela-base/reglas"
          class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
        >
          <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
            <Settings class="h-4 w-4 text-slate-400" />
            Reglas quiniela base
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
  </div>
</template>
