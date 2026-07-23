<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  Check,
  ChevronRight,
  ClipboardList,
  Grid3x3,
  Info,
  LogOut,
  Pencil,
  RefreshCw,
  Target,
  Trophy,
  X,
  Shield,
} from '@lucide/vue'
import { JORNADAS_PATH } from '@/constants/nav'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import PushReminderCard from '@/components/shared/PushReminderCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { usePwaStore } from '@/stores/pwaStore'
import type { BaseRoundResultSummary } from '@/types'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const pwa = usePwaStore()
const router = useRouter()
const loggingOut = ref(false)
const editingUsername = ref(false)
const usernameDraft = ref('')
const savingUsername = ref(false)
const usernameError = ref<string | null>(null)

const appVersion = __APP_VERSION__
const appCommit = __APP_COMMIT__
const buildDate = new Date(__APP_BUILD_TIME__).toLocaleDateString('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const loadingStats = ref(false)
const statsError = ref<string | null>(null)
const roundResults = ref<BaseRoundResultSummary[]>([])

const playedRounds = computed(() =>
  roundResults.value
    .filter((r) => (r.myEntry?.predictions_count ?? 0) > 0)
    .sort((a, b) => a.round.round_number - b.round.round_number),
)

const roundsPlayedCount = computed(() => playedRounds.value.length)

const avgAciertosPct = computed(() => {
  if (!playedRounds.value.length) return null
  const total = playedRounds.value.reduce((sum, r) => {
    const entry = r.myEntry!
    return sum + entry.correct_count / Math.max(entry.match_count, 1)
  }, 0)
  return (total / playedRounds.value.length) * 100
})

const avgAciertosCount = computed(() => {
  if (!playedRounds.value.length) return null
  const total = playedRounds.value.reduce((sum, r) => sum + (r.myEntry?.correct_count ?? 0), 0)
  return total / playedRounds.value.length
})

const totalPoints = computed(() =>
  playedRounds.value.reduce((sum, r) => sum + (r.myEntry?.total_points ?? 0), 0),
)

const bestRound = computed<BaseRoundResultSummary | null>(() => {
  if (!playedRounds.value.length) return null
  return [...playedRounds.value].sort(
    (a, b) => (b.myEntry?.correct_count ?? 0) - (a.myEntry?.correct_count ?? 0),
  )[0]!
})

function barHeightPct(round: BaseRoundResultSummary): number {
  const entry = round.myEntry
  if (!entry || !entry.match_count) return 0
  const pct = (entry.correct_count / entry.match_count) * 100
  return entry.correct_count > 0 ? Math.max(pct, 6) : 0
}

function barTitle(round: BaseRoundResultSummary): string {
  const entry = round.myEntry
  if (!entry) return round.round.title
  return `${round.round.title}: ${entry.correct_count}/${entry.match_count} aciertos · ${entry.total_points} pts`
}

async function loadStats() {
  if (!auth.user) return
  loadingStats.value = true
  statsError.value = null
  try {
    roundResults.value = await baseStore.fetchAllRoundResults(auth.user.id)
  } catch (err) {
    statsError.value = err instanceof Error ? err.message : 'No se pudieron cargar tus estadísticas'
  } finally {
    loadingStats.value = false
  }
}

const checkingUpdate = ref(false)
const applyingUpdate = ref(false)
const updateFeedback = ref<'uptodate' | 'unavailable' | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function showUpdateFeedback(kind: 'uptodate' | 'unavailable') {
  updateFeedback.value = kind
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    updateFeedback.value = null
  }, 3200)
}

async function checkAndUpdateApp() {
  if (checkingUpdate.value || applyingUpdate.value) return
  updateFeedback.value = null
  checkingUpdate.value = true
  try {
    if (pwa.needRefresh) {
      applyingUpdate.value = true
      await pwa.applyUpdate()
      return
    }

    const result = await pwa.checkForUpdate()
    if (result === 'available') {
      applyingUpdate.value = true
      await pwa.applyUpdate()
      return
    }
    showUpdateFeedback(result)
  } finally {
    checkingUpdate.value = false
    applyingUpdate.value = false
  }
}

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
  await loadStats()
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

    <section v-if="auth.isLoggedIn" class="mb-8" aria-label="Tus estadísticas">
      <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Tu desempeño
      </p>

      <DataSkeleton v-if="loadingStats" variant="profile" />
      <p v-else-if="statsError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {{ statsError }}
      </p>
      <p
        v-else-if="!roundsPlayedCount"
        class="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-400"
      >
        Aún no tienes quinielas jugadas. ¡Marca tus picks en la jornada activa!
      </p>

      <template v-else>
        <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-slate-500">Jornadas jugadas</p>
            <p class="mt-1 text-xl font-bold text-slate-100">{{ roundsPlayedCount }}</p>
          </div>
          <div class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-3">
            <p class="text-xs text-slate-400">Promedio de aciertos</p>
            <p class="mt-1 text-xl font-bold text-mundial-accent">
              {{ avgAciertosCount?.toFixed(1) }}
              <span class="text-xs font-medium text-slate-400">({{ avgAciertosPct?.toFixed(0) }}%)</span>
            </p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-slate-500">Puntos totales</p>
            <p class="mt-1 text-xl font-bold text-slate-100">{{ totalPoints }}</p>
          </div>
          <div class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-3">
            <p class="inline-flex items-center gap-1 text-xs text-slate-400">
              <Trophy class="h-3 w-3" />
              Mejor jornada
            </p>
            <p class="mt-1 truncate text-xl font-bold text-mundial-green">
              {{ bestRound?.myEntry?.correct_count ?? 0 }}/{{ bestRound?.myEntry?.match_count ?? 0 }}
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <p class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Target class="h-3.5 w-3.5" />
              Aciertos por jornada
            </p>
          </div>

          <div class="overflow-x-auto">
            <div class="flex h-28 min-w-max items-end gap-3 pb-1">
              <div
                v-for="round in playedRounds"
                :key="round.round.id"
                class="flex w-8 shrink-0 flex-col items-center justify-end gap-1"
              >
                <span class="text-[0.65rem] font-semibold tabular-nums text-slate-400">
                  {{ round.myEntry?.correct_count ?? 0 }}
                </span>
                <div class="flex h-20 w-full items-end justify-center">
                  <div
                    class="w-4 rounded-t-sm bg-mundial-accent transition-all"
                    :style="{ height: `${barHeightPct(round)}%` }"
                    :title="barTitle(round)"
                  />
                </div>
                <span class="text-[0.65rem] text-slate-500">J{{ round.round.round_number }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>

    <PushReminderCard v-if="auth.user" class="mb-8" :user-id="auth.user.id" />

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
        to="/reglas"
        class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
      >
        <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
          <ClipboardList class="h-4 w-4 text-slate-400" />
          Reglas y pagos
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

    <section class="mb-8">
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

    <section
      class="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
      aria-label="Acerca de la app"
    >
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <Info class="h-3.5 w-3.5 shrink-0" />
        <span>
          v{{ appVersion }} · {{ appCommit }} · {{ buildDate }}
        </span>
      </div>

      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        :class="pwa.needRefresh ? 'border-mundial-accent/40 bg-mundial-accent/15 text-mundial-accent' : ''"
        :disabled="checkingUpdate || applyingUpdate"
        @click="checkAndUpdateApp"
      >
        <RefreshCw
          class="h-4 w-4"
          :class="checkingUpdate || applyingUpdate ? 'animate-spin' : ''"
        />
        <span v-if="applyingUpdate || (checkingUpdate && pwa.needRefresh)">Actualizando...</span>
        <span v-else-if="checkingUpdate">Verificando...</span>
        <span v-else-if="pwa.needRefresh">Actualizar ahora</span>
        <span v-else>Verificar actualización</span>
      </button>

      <p
        v-if="updateFeedback === 'uptodate'"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-mundial-green"
      >
        <Check class="h-3.5 w-3.5" />
        Estás al día con la última versión
      </p>
      <p
        v-else-if="updateFeedback === 'unavailable'"
        class="text-xs text-slate-400"
      >
        No se pudo verificar ahora. Intenta de nuevo en unos segundos.
      </p>
      <p
        v-else-if="pwa.needRefresh"
        class="text-xs text-mundial-accent/90"
      >
        Hay una versión nueva lista. Pulsa para instalarla.
      </p>
    </section>
  </div>
</template>
