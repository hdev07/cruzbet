<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Crown, PiggyBank, Target } from '@lucide/vue'
import BaseRoundRankingPanel from '@/components/ranking/BaseRoundRankingPanel.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import {
  BASE_QUINIELA_MATCHES_PER_ROUND,
  computeRoundPool,
} from '@/constants/base-quiniela-rules'
import { formatMxn } from '@/lib/formatMoney'
import { getOfficialLeaderboardEntries, getTiedFirstPlaceEntries, winnerUserIdsFromEntries } from '@/lib/baseQuinielaWinners'
import { friendlyLoadError } from '@/lib/offlineCache'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseRoundLeaderboardEntry } from '@/types'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loadError = ref<string | null>(null)
const roundLoading = ref(false)
const selectedRoundId = ref<string | null>(null)
const myLeaderboardEntry = ref<BaseRoundLeaderboardEntry | null>(null)
const previousWinnerUserIds = ref<string[]>([])
let loadSeq = 0

const activeRoundId = computed(() => selectedRoundId.value ?? baseStore.activeRound?.id ?? null)

const selectedRound = computed(
  () =>
    baseStore.rounds.find((r) => r.id === activeRoundId.value) ??
    (baseStore.currentRound?.id === activeRoundId.value ? baseStore.currentRound : null),
)

const previousRound = computed(() => {
  const current = selectedRound.value
  if (!current) return null
  return (
    baseStore.rounds.find((r) => r.round_number === current.round_number - 1) ?? null
  )
})

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

const leader = computed(() => {
  const official = getOfficialLeaderboardEntries(baseStore.leaderboard)
  return official[0] ?? null
})

const tiedLeaders = computed(() => {
  if (!leader.value) return []
  return getTiedFirstPlaceEntries(getOfficialLeaderboardEntries(baseStore.leaderboard))
})

const poolBreakdown = computed(() => {
  const verified = getOfficialLeaderboardEntries(baseStore.leaderboard).length
  return computeRoundPool(verified)
})

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

async function loadPreviousWinners(seq: number) {
  const prev = previousRound.value
  if (!prev) {
    if (seq === loadSeq) previousWinnerUserIds.value = []
    return
  }
  try {
    const winners = await baseStore.fetchRoundTiedWinners(prev.id)
    if (seq !== loadSeq) return
    previousWinnerUserIds.value = winnerUserIdsFromEntries(winners)
  } catch {
    if (seq === loadSeq) previousWinnerUserIds.value = []
  }
}

async function loadRoundData(roundId: string) {
  const seq = ++loadSeq
  loadError.value = null
  roundLoading.value = true
  previousWinnerUserIds.value = []
  try {
    await baseStore.fetchRound(roundId)
    if (seq !== loadSeq) return

    const [, entry] = await Promise.all([
      baseStore.fetchRoundLeaderboard(roundId),
      auth.user
        ? baseStore.fetchMyLeaderboardEntry(roundId, auth.user.id)
        : Promise.resolve(null),
      loadPreviousWinners(seq),
    ] as const)
    if (seq !== loadSeq) return

    myLeaderboardEntry.value = entry ?? null

    if (auth.user) {
      await baseStore.fetchMyPredictions(roundId, auth.user.id)
    } else {
      myLeaderboardEntry.value = null
    }
  } catch (err) {
    if (seq !== loadSeq) return
    loadError.value = friendlyLoadError(err, 'No se pudieron cargar los resultados')
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
    loadError.value = friendlyLoadError(err, 'No se pudieron cargar los resultados')
  }
})

watch(activeRoundId, (roundId, prevRoundId) => {
  if (!roundId || roundId === prevRoundId) return
  void loadRoundData(roundId)
})
</script>

<template>
  <div>
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
          Quiniela
        </p>
        <h1 class="text-2xl font-bold text-app-text lg:text-3xl">Resultados</h1>
      </div>

      <div v-if="baseStore.rounds.length" class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <span
          v-if="selectedRound && isRoundActive && !isRoundFinished"
          class="rounded-full bg-mundial-green/15 px-2.5 py-1 text-xs font-semibold text-mundial-green"
        >
          En curso
        </span>
        <span
          v-else-if="selectedRound && isRoundFinished"
          class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400"
        >
          Finalizada
        </span>
        <label class="block min-w-[10rem] flex-1 sm:flex-initial">
          <span class="sr-only">Seleccionar jornada</span>
          <select
            v-model="selectedRoundId"
            class="theme-field w-full rounded-lg px-3 py-2 text-sm"
          >
            <option v-for="round in baseStore.rounds" :key="round.id" :value="round.id">
              {{ round.title }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="baseStore.loading && !baseStore.rounds.length" class="space-y-5">
      <DataSkeleton variant="cards" :cards="4" />
      <DataSkeleton variant="matrix" :rows="6" />
    </div>

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
      <div
        v-if="activeRoundId && !roundLoading"
        class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <div class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3">
          <p class="flex items-center gap-1.5 text-xs text-slate-400">
            <PiggyBank class="h-3.5 w-3.5" />
            En el pozo
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-mundial-accent">
            {{ formatMxn(poolBreakdown.net) }}
          </p>
          <p class="mt-0.5 text-[0.65rem] text-slate-500">
            <template v-if="poolBreakdown.verifiedCount">
              {{ poolBreakdown.verifiedCount }} pagados · −{{ poolBreakdown.feePercent }}% admin
            </template>
            <template v-else>
              Solo depósitos verificados
            </template>
          </p>
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
            {{
              isRoundFinished
                ? tiedLeaders.length > 1
                  ? 'Ganadores'
                  : 'Ganador'
                : tiedLeaders.length > 1
                  ? 'Líderes'
                  : 'Líder'
            }}
          </p>
          <p
            v-if="tiedLeaders.length"
            class="mt-1 truncate text-sm font-bold text-mundial-accent sm:text-base"
          >
            {{ tiedLeaders.map((e) => e.username ?? 'Anónimo').join(', ') }}
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

      <div v-else-if="activeRoundId && roundLoading" class="mb-5">
        <DataSkeleton variant="cards" :cards="4" />
      </div>

      <BaseRoundRankingPanel
        v-if="activeRoundId"
        :round-id="activeRoundId"
        :round="selectedRound"
        :round-matches="baseStore.roundMatches"
        :loading="roundLoading"
        :previous-winner-user-ids="previousWinnerUserIds"
      />

      <RouterLink
        v-if="activeRoundId"
        :to="`/jornadas/${activeRoundId}`"
        class="mt-4 inline-flex items-center gap-1 text-sm text-mundial-green hover:underline"
      >
        Ir a la jornada para marcar tus picks
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </template>
  </div>
</template>
