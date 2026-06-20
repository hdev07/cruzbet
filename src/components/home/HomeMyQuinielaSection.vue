<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowDown, ArrowUp, ChevronRight, Target, Trophy } from '@lucide/vue'
import { BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import { JORNADAS_PATH } from '@/constants/nav'
import {
  aciertosDiffLabel,
  getLeaderboardNeighbors,
  summarizeBasePredictions,
} from '@/lib/baseQuinielaStats'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseRoundLeaderboardEntry } from '@/types'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()

const loading = ref(false)
const loadError = ref<string | null>(null)
const roundLeaderboard = ref<BaseRoundLeaderboardEntry[]>([])
const tournamentTotals = ref<ReturnType<typeof summarizeBasePredictions> | null>(null)
const tournamentRounds = ref(0)
let loadSeq = 0

const activeRound = computed(() => baseStore.activeRound)
const activeRoundId = computed(() => activeRound.value?.id ?? null)
const activeRoundHref = computed(() =>
  activeRoundId.value ? `/jornadas/${activeRoundId.value}` : JORNADAS_PATH,
)

const matchCount = computed(
  () => activeRound.value?.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND,
)

const roundSummary = computed(() =>
  summarizeBasePredictions(baseStore.myPredictions, matchCount.value),
)

const isSubmitted = computed(() => baseStore.isQuinielaSubmitted())

const neighbors = computed(() => {
  const userId = auth.user?.id
  if (!userId) return getLeaderboardNeighbors([], '')
  return getLeaderboardNeighbors(
    roundLeaderboard.value,
    userId,
    baseStore.currentEntryNumber,
  )
})

const myCorrect = computed(
  () => neighbors.value.me?.correct_count ?? roundSummary.value.correct_count,
)

const myPoints = computed(
  () => neighbors.value.me?.total_points ?? roundSummary.value.total_points,
)

const hasRoundActivity = computed(
  () =>
    isSubmitted.value ||
    roundSummary.value.picks_count > 0 ||
    neighbors.value.me != null,
)

async function loadMyData() {
  const roundId = activeRoundId.value
  const userId = auth.user?.id
  if (!roundId || !userId) return

  const seq = ++loadSeq
  loading.value = true
  loadError.value = null

  try {
    if (!baseStore.rounds.length) {
      await baseStore.fetchRounds()
    }
    if (seq !== loadSeq) return

    await Promise.all([
      baseStore.fetchRound(roundId),
      baseStore.fetchMyPredictions(roundId, userId),
      baseStore.queryRoundLeaderboard(roundId, 200).then((rows) => {
        if (seq === loadSeq) roundLeaderboard.value = rows
      }),
    ])
    if (seq !== loadSeq) return

    const history = await baseStore.fetchUserHistory(userId)
    if (seq !== loadSeq) return

    const roundIds = new Set(history.map((row) => row.round_id))
    tournamentRounds.value = roundIds.size
    tournamentTotals.value = summarizeBasePredictions(history)
  } catch (err) {
    if (seq !== loadSeq) return
    loadError.value = err instanceof Error ? err.message : 'No se pudieron cargar tus datos'
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

onMounted(() => {
  if (auth.isLoggedIn) void loadMyData()
})

watch([activeRoundId, () => auth.user?.id], ([roundId, userId], [prevRoundId]) => {
  if (!userId) return
  if (roundId && roundId !== prevRoundId) void loadMyData()
})
</script>

<template>
  <section v-if="auth.isLoggedIn && activeRound" class="mb-6">
    <div class="mb-3 flex items-end justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
          Tu quiniela
        </p>
        <h2 class="mt-1 text-lg font-bold text-app-text">
          {{ activeRound.title }}
        </h2>
      </div>
      <RouterLink
        :to="activeRoundHref"
        class="inline-flex shrink-0 items-center gap-1 text-xs text-mundial-green hover:underline sm:text-sm"
      >
        Ir a jornada
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-white/10 theme-surface-gradient-via"
    >
      <p v-if="loadError" class="p-4 text-sm text-red-300">
        {{ loadError }}
      </p>

      <div v-else-if="loading" class="p-5">
        <div class="grid grid-cols-3 gap-3">
          <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>

      <template v-else-if="!hasRoundActivity">
        <div class="p-5 text-center sm:text-left">
          <p class="text-sm font-medium text-slate-200">
            Aún no participas en esta jornada
          </p>
          <p class="mt-1 text-xs text-slate-400">
            Marca L, E o V en los {{ matchCount }} partidos y compite por el premio
          </p>
          <RouterLink
            :to="activeRoundHref"
            class="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-mundial-green px-4 py-2.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
          >
            <Target class="h-4 w-4" />
            Empezar quiniela
          </RouterLink>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
          <div class="px-4 py-4 text-center">
            <p class="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
              Posición
            </p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-slate-100">
              <template v-if="neighbors.position != null">#{{ neighbors.position }}</template>
              <template v-else>—</template>
            </p>
            <p v-if="roundLeaderboard.length" class="mt-0.5 text-[0.65rem] text-slate-500">
              de {{ roundLeaderboard.length }}
            </p>
          </div>

          <div class="px-4 py-4 text-center">
            <p class="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
              Aciertos
            </p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-mundial-green">
              {{ myCorrect }}
            </p>
            <p
              v-if="roundSummary.pending_count > 0"
              class="mt-0.5 text-[0.65rem] text-slate-500"
            >
              {{ roundSummary.pending_count }} pend.
            </p>
          </div>

          <div class="px-4 py-4 text-center">
            <p class="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
              Puntos
            </p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-mundial-accent">
              {{ myPoints }}
            </p>
          </div>
        </div>

        <div
          v-if="!isSubmitted && roundSummary.picks_count < matchCount"
          class="border-b border-white/10 px-4 py-3"
        >
          <div class="mb-2 flex items-center justify-between text-xs">
            <span class="text-slate-400">Progreso de picks</span>
            <span class="font-medium tabular-nums text-slate-300">
              {{ roundSummary.picks_count }}/{{ matchCount }}
            </span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              class="h-full rounded-full bg-mundial-green transition-all"
              :style="{ width: `${(roundSummary.picks_count / matchCount) * 100}%` }"
            />
          </div>
          <RouterLink
            :to="activeRoundHref"
            class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-mundial-green hover:underline"
          >
            Completar quiniela
            <ChevronRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>

        <div
          v-else-if="neighbors.above || neighbors.below"
          class="space-y-2 border-b border-white/10 px-4 py-3"
        >
          <p class="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
            A tu alrededor
          </p>

          <div
            v-if="neighbors.above"
            class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-accent/20 text-mundial-accent"
            >
              <ArrowUp class="h-3.5 w-3.5" />
            </span>
            <img
              v-if="neighbors.above.avatar"
              :src="neighbors.above.avatar"
              :alt="neighbors.above.username ?? 'Jugador'"
              class="h-8 w-8 shrink-0 rounded-full border border-white/20"
            />
            <span
              v-else
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-400"
            >
              {{ neighbors.above.username?.[0]?.toUpperCase() ?? '?' }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-200">
                {{ neighbors.above.username ?? 'Anónimo' }}
              </p>
              <p class="text-xs text-slate-500">
                {{ neighbors.above.correct_count }} aciertos · arriba de ti
              </p>
            </div>
            <span class="shrink-0 text-xs font-semibold text-amber-400/90">
              {{ aciertosDiffLabel(myCorrect, neighbors.above.correct_count) }}
            </span>
          </div>

          <div
            v-if="neighbors.below"
            class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-400"
            >
              <ArrowDown class="h-3.5 w-3.5" />
            </span>
            <img
              v-if="neighbors.below.avatar"
              :src="neighbors.below.avatar"
              :alt="neighbors.below.username ?? 'Jugador'"
              class="h-8 w-8 shrink-0 rounded-full border border-white/20"
            />
            <span
              v-else
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-400"
            >
              {{ neighbors.below.username?.[0]?.toUpperCase() ?? '?' }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-200">
                {{ neighbors.below.username ?? 'Anónimo' }}
              </p>
              <p class="text-xs text-slate-500">
                {{ neighbors.below.correct_count }} aciertos · abajo de ti
              </p>
            </div>
            <span class="shrink-0 text-xs font-semibold text-slate-400">
              {{ aciertosDiffLabel(myCorrect, neighbors.below.correct_count) }}
            </span>
          </div>
        </div>

        <div
          v-else-if="isSubmitted && neighbors.position === 1"
          class="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm text-mundial-green"
        >
          <Trophy class="h-4 w-4 shrink-0" />
          Vas primero en la jornada. ¡A mantener la ventaja!
        </div>

        <div
          v-if="tournamentTotals && tournamentRounds > 0"
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-500"
        >
          <span>
            Torneo:
            <span class="font-medium text-slate-300">
              {{ tournamentTotals.correct_count }} aciertos
            </span>
            en {{ tournamentRounds }}
            {{ tournamentRounds === 1 ? 'jornada' : 'jornadas' }}
          </span>
          <RouterLink to="/historial" class="text-mundial-accent hover:underline">
            Ver historial
          </RouterLink>
        </div>
      </template>
    </div>
  </section>
</template>
