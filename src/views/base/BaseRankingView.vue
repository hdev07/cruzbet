<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Crown, Target, Users } from '@lucide/vue'
import BaseRoundRankingPanel from '@/components/ranking/BaseRoundRankingPanel.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_LOGIC,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseRoundLeaderboardEntry } from '@/types'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loadError = ref<string | null>(null)
const roundLoading = ref(false)
const selectedRoundId = ref<string | null>(null)
const participantCount = ref(0)
const myLeaderboardEntry = ref<BaseRoundLeaderboardEntry | null>(null)
let loadSeq = 0

const activeRoundId = computed(() => selectedRoundId.value ?? baseStore.activeRound?.id ?? null)

const selectedRound = computed(
  () =>
    baseStore.rounds.find((r) => r.id === activeRoundId.value) ??
    (baseStore.currentRound?.id === activeRoundId.value ? baseStore.currentRound : null),
)

const isRoundActive = computed(() => activeRoundId.value === baseStore.activeRound?.id)

const matchStats = computed(() => {
  const matches = baseStore.roundMatches
  const total =
    matches.length ||
    selectedRound.value?.match_count ||
    BASE_QUINIELA_MATCHES_PER_ROUND
  const finished = matches.filter((rm) => rm.match?.status === 'finished').length
  const live = matches.filter((rm) => rm.match?.status === 'live').length
  return { total, finished, live, pending: Math.max(0, total - finished - live) }
})

const isRoundFinished = computed(
  () => matchStats.value.total > 0 && matchStats.value.finished === matchStats.value.total,
)

const leader = computed(() => baseStore.leaderboard[0] ?? null)

const myRank = computed(() => {
  if (!auth.user) return null
  const index = baseStore.leaderboard.findIndex(
    (e) =>
      e.user_id === auth.user!.id &&
      e.entry_number === baseStore.currentEntryNumber,
  )
  return index >= 0 ? index + 1 : null
})

const myDisplayedEntry = computed(
  () =>
    myLeaderboardEntry.value ??
    (auth.user
      ? baseStore.leaderboard.find(
          (e) =>
            e.user_id === auth.user!.id &&
            e.entry_number === baseStore.currentEntryNumber,
        ) ?? null
      : null),
)

async function loadRoundData(roundId: string) {
  const seq = ++loadSeq
  loadError.value = null
  roundLoading.value = true
  try {
    await baseStore.fetchRound(roundId)
    if (seq !== loadSeq) return

    const [count, entry] = await Promise.all([
      baseStore.fetchRoundParticipantCount(roundId),
      auth.user
        ? baseStore.fetchMyLeaderboardEntry(roundId, auth.user.id)
        : Promise.resolve(null),
      baseStore.fetchRoundLeaderboard(roundId),
    ] as const)
    if (seq !== loadSeq) return

    participantCount.value = count
    myLeaderboardEntry.value = entry ?? null

    if (auth.user) {
      await baseStore.fetchMyPredictions(roundId, auth.user.id)
    } else {
      myLeaderboardEntry.value = null
    }
  } catch (err) {
    if (seq !== loadSeq) return
    loadError.value = err instanceof Error ? err.message : 'No se pudo cargar el ranking'
  } finally {
    if (seq === loadSeq) roundLoading.value = false
  }
}

onMounted(async () => {
  loadError.value = null
  try {
    await baseStore.fetchRounds()
    if (!selectedRoundId.value) {
      selectedRoundId.value =
        baseStore.activeRound?.id ?? baseStore.rounds[0]?.id ?? null
    }
    if (activeRoundId.value) {
      await loadRoundData(activeRoundId.value)
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'No se pudo cargar el ranking'
  }
})

watch(activeRoundId, (roundId, prevRoundId) => {
  if (!roundId || roundId === prevRoundId) return
  void loadRoundData(roundId)
})
</script>

<template>
  <div>
    <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
      Clasificación
    </p>
    <h1 class="mb-2 text-2xl font-bold text-app-text lg:text-3xl">Ranking</h1>
    <p class="mb-6 text-sm text-slate-400 lg:text-base">
      Posiciones y pronósticos por jornada
    </p>

    <p v-if="baseStore.loading && !baseStore.rounds.length" class="text-slate-400">
      Cargando ranking...
    </p>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <div
      v-else-if="!baseStore.rounds.length"
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      Aún no hay jornadas disponibles.
    </div>

    <template v-else>
      <div class="mb-6 flex flex-wrap items-end gap-4">
        <label class="block min-w-[12rem] flex-1 max-w-sm">
          <span class="mb-1 block text-xs text-slate-400">Jornada</span>
          <select
            v-model="selectedRoundId"
            class="theme-field w-full rounded-lg px-3 py-2 text-sm"
          >
            <option v-for="round in baseStore.rounds" :key="round.id" :value="round.id">
              {{ round.title }}
            </option>
          </select>
        </label>

        <div v-if="selectedRound" class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold text-slate-200">{{ selectedRound.title }}</h2>
            <span
              v-if="isRoundActive && !isRoundFinished"
              class="rounded-full bg-mundial-green/15 px-2 py-0.5 text-xs font-semibold text-mundial-green"
            >
              En curso
            </span>
            <span
              v-else-if="isRoundFinished"
              class="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-400"
            >
              Finalizada
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500 sm:text-sm">
            {{ selectedRound.match_count }} partidos · {{ BASE_QUINIELA_POINTS_PER_HIT }} pts por acierto ·
            ${{ BASE_ENTRY_FEE_MXN }} MXN
          </p>
        </div>
      </div>

      <div
        v-if="activeRoundId && !roundLoading"
        class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p class="flex items-center gap-1.5 text-xs text-slate-400">
            <Users class="h-3.5 w-3.5" />
            Participantes
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-slate-200">
            {{ participantCount }}
          </p>
          <p class="mt-0.5 text-[0.65rem] text-slate-500">Quinielas completas</p>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p class="flex items-center gap-1.5 text-xs text-slate-400">
            <Target class="h-3.5 w-3.5" />
            Partidos
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-slate-200">
            {{ matchStats.finished }}/{{ matchStats.total }}
          </p>
          <p class="mt-0.5 text-[0.65rem] text-slate-500">
            <span v-if="matchStats.live">{{ matchStats.live }} en vivo · </span>
            {{ matchStats.pending }} pendientes
          </p>
        </div>

        <div
          class="rounded-xl border px-4 py-3"
          :class="
            leader
              ? 'border-mundial-accent/30 bg-mundial-accent/10'
              : 'border-white/10 bg-white/5'
          "
        >
          <p class="flex items-center gap-1.5 text-xs text-slate-400">
            <Crown class="h-3.5 w-3.5" />
            {{ isRoundFinished ? 'Ganador' : 'Líder' }}
          </p>
          <p
            v-if="leader"
            class="mt-1 truncate text-sm font-bold text-mundial-accent sm:text-base"
          >
            {{ leader.username ?? 'Anónimo' }}
          </p>
          <p v-else class="mt-1 text-sm text-slate-500">Sin datos aún</p>
          <p v-if="leader" class="mt-0.5 text-[0.65rem] text-slate-500">
            {{ leader.correct_count }} aciertos · {{ leader.total_points }} pts
          </p>
        </div>

        <div
          v-if="auth.isLoggedIn"
          class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3"
        >
          <p class="text-xs text-slate-400">Tu posición</p>
          <p v-if="myRank" class="mt-1 text-2xl font-bold tabular-nums text-mundial-accent">
            #{{ myRank }}
          </p>
          <p v-else-if="myDisplayedEntry?.is_complete" class="mt-1 text-sm font-semibold text-slate-300">
            Fuera del top {{ baseStore.leaderboard.length || 50 }}
          </p>
          <p v-else class="mt-1 text-sm text-slate-500">Sin quiniela completa</p>
          <p v-if="myDisplayedEntry?.is_complete" class="mt-0.5 text-[0.65rem] text-slate-500">
            {{ myDisplayedEntry.correct_count }} aciertos · {{ myDisplayedEntry.total_points }} pts
          </p>
        </div>
      </div>

      <div
        v-else-if="activeRoundId && roundLoading"
        class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="h-[5.5rem] animate-pulse rounded-xl border border-white/10 bg-white/5"
        />
      </div>

      <p class="mb-4 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-slate-500">
        {{ BASE_QUINIELA_LOGIC.summary }}
      </p>

      <BaseRoundRankingPanel
        v-if="activeRoundId"
        :round-id="activeRoundId"
        :round-matches="baseStore.roundMatches"
        :loading="roundLoading"
      />

      <RouterLink
        v-if="activeRoundId"
        :to="`/jornadas/${activeRoundId}`"
        class="mt-4 inline-flex items-center gap-1 text-sm text-mundial-green hover:underline"
      >
        Ir a la jornada para marcar tus picks
        <ChevronRight class="h-4 w-4" />
      </RouterLink>

      <RouterLink
        to="/resultados"
        class="mt-6 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        Ver ganadores y podio por jornada
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </template>
  </div>
</template>
