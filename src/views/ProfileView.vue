<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Check, ChevronRight, Grid3x3, LogOut, Pencil, Shield, X } from '@lucide/vue'
import { JORNADAS_PATH } from '@/constants/nav'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)
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
    <header class="mb-6">
      <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Cuenta
      </p>
      <h1 class="text-2xl font-bold text-slate-100 lg:text-3xl">Mi perfil</h1>
    </header>

    <div class="mb-8 flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-6 text-center lg:mx-auto lg:max-w-md lg:p-8">
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

    <section class="mb-8 space-y-2">
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

      <RouterLink
        :to="JORNADAS_PATH"
        class="flex items-center justify-between rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-4 py-3 transition hover:bg-mundial-green/15"
      >
        <span class="inline-flex items-center gap-2 text-sm font-medium text-mundial-green">
          <Grid3x3 class="h-4 w-4" />
          Ir a la quiniela
        </span>
        <ChevronRight class="h-4 w-4 text-mundial-green/60" />
      </RouterLink>
    </section>

    <section>
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
