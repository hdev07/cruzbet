<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronDown, ChevronRight } from '@lucide/vue'
import {
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_MAX_POINTS,
} from '@/constants/base-quiniela-rules'
import { winnerCode } from '@/lib/baseQuinielaDisplay'
import {
  formatRoundScoreSummary,
  summarizeBasePredictions,
} from '@/lib/baseQuinielaStats'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BasePrediction, BaseQuinielaRound, Match } from '@/types'

type HistoryRow = BasePrediction & {
  round?: BaseQuinielaRound
  match?: Match
}

type RoundHistoryGroup = {
  round: BaseQuinielaRound | undefined
  roundId: string
  picks: HistoryRow[]
  summary: ReturnType<typeof summarizeBasePredictions>
  expanded: boolean
}

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loading = ref(false)
const history = ref<HistoryRow[]>([])
const expandedRounds = ref<Set<string>>(new Set())

onMounted(async () => {
  if (!auth.user) return
  loading.value = true
  try {
    history.value = await baseStore.fetchUserHistory(auth.user.id)
    const firstRoundId = groupedByRound.value[0]?.roundId
    if (firstRoundId) expandedRounds.value.add(firstRoundId)
  } finally {
    loading.value = false
  }
})

const groupedByRound = computed<RoundHistoryGroup[]>(() => {
  const map = new Map<string, RoundHistoryGroup>()
  for (const row of history.value) {
    const key = row.round_id
    if (!map.has(key)) {
      map.set(key, {
        round: row.round,
        roundId: key,
        picks: [],
        summary: summarizeBasePredictions([], row.round?.match_count),
        expanded: false,
      })
    }
    map.get(key)!.picks.push(row)
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      summary: summarizeBasePredictions(
        group.picks,
        group.round?.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND,
      ),
      expanded: expandedRounds.value.has(group.roundId),
    }))
    .sort((a, b) => (b.round?.round_number ?? 0) - (a.round?.round_number ?? 0))
})

const totals = computed(() => {
  const all = history.value
  return summarizeBasePredictions(all)
})

function toggleRound(roundId: string) {
  const next = new Set(expandedRounds.value)
  if (next.has(roundId)) next.delete(roundId)
  else next.add(roundId)
  expandedRounds.value = next
}

function roundStatusLabel(group: RoundHistoryGroup): string {
  if (group.summary.is_fully_scored) return 'Finalizada'
  if (group.summary.scored_count > 0) return 'En curso'
  return 'Pendiente'
}
</script>

<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Historial</h1>
    <p class="mb-6 text-sm text-slate-400">Tus picks L/E/V por jornada</p>

    <div
      v-if="!auth.isLoggedIn"
      class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-6 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para ver tu historial</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-green px-4 py-2 text-sm font-semibold text-mundial-dark"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <template v-else>
      <p v-if="loading" class="text-slate-400">Cargando historial...</p>

      <div
        v-else-if="!groupedByRound.length"
        class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
      >
        Aún no tienes predicciones.
      </div>

      <template v-else>
        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-lg">
          <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p class="text-xs text-slate-400">Jornadas</p>
            <p class="text-2xl font-bold text-slate-200">{{ groupedByRound.length }}</p>
          </div>
          <div class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-4 py-3">
            <p class="text-xs text-slate-400">Aciertos totales</p>
            <p class="text-2xl font-bold text-mundial-green">{{ totals.correct_count }}</p>
          </div>
          <div class="col-span-2 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3 sm:col-span-1">
            <p class="text-xs text-slate-400">Puntos (todas las jornadas)</p>
            <p class="text-2xl font-bold text-mundial-accent">{{ totals.total_points }}</p>
            <p class="text-[0.65rem] text-slate-500">Solo referencia; el premio es por jornada</p>
          </div>
        </div>

        <RouterLink
          to="/resultados"
          class="mb-6 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
        >
          Ver ganadores por jornada
          <ChevronRight class="h-4 w-4" />
        </RouterLink>

        <div class="space-y-4">
          <section
            v-for="group in groupedByRound"
            :key="group.roundId"
            class="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <button
              type="button"
              class="flex w-full items-start justify-between gap-3 text-left"
              @click="toggleRound(group.roundId)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="font-semibold text-slate-200">
                    {{ group.round?.title ?? 'Jornada' }}
                  </h2>
                  <span
                    class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
                    :class="
                      group.summary.is_fully_scored
                        ? 'bg-mundial-green/15 text-mundial-green'
                        : group.summary.scored_count > 0
                          ? 'bg-mundial-accent/15 text-mundial-accent'
                          : 'bg-white/10 text-slate-400'
                    "
                  >
                    {{ roundStatusLabel(group) }}
                  </span>
                </div>

                <p class="mt-1 text-sm font-medium text-mundial-accent">
                  {{ formatRoundScoreSummary(group.summary) }}
                </p>

                <p class="mt-1 text-xs text-slate-500">
                  {{ group.summary.picks_count }}/{{ group.round?.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND }}
                  partidos · máx. {{ BASE_QUINIELA_MAX_POINTS }} pts
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <RouterLink
                  v-if="group.round"
                  :to="`/jornadas/${group.round.id}`"
                  class="hidden text-xs text-mundial-green hover:underline sm:inline"
                  @click.stop
                >
                  Ver jornada
                </RouterLink>
                <ChevronDown
                  class="h-5 w-5 text-slate-400 transition"
                  :class="group.expanded ? 'rotate-180' : ''"
                />
              </div>
            </button>

            <ul v-if="group.expanded" class="mt-4 space-y-2 border-t border-white/5 pt-4">
              <li
                v-for="pick in group.picks"
                :key="pick.id"
                class="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
              >
                <span class="font-bold text-mundial-green">{{ winnerCode(pick.predicted_winner) }}</span>
                <span class="min-w-0 flex-1 truncate text-slate-300">
                  {{ teamDisplayName(pick.match?.home_team, 'Local') }}
                  vs
                  {{ teamDisplayName(pick.match?.away_team, 'Visitante') }}
                </span>
                <span
                  v-if="pick.scored_at"
                  class="shrink-0 text-xs font-semibold tabular-nums"
                  :class="pick.points > 0 ? 'text-mundial-green' : 'text-red-400'"
                >
                  {{ pick.points }} pts
                </span>
                <span v-else class="shrink-0 text-xs text-slate-500">Pendiente</span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </template>
  </div>
</template>
