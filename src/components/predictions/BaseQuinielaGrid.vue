<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, XCircle } from '@lucide/vue'
import { BASE_QUINIELA_POINTS_PER_HIT } from '@/constants/base-quiniela-rules'
import { isPredictionCorrect, winnerCode } from '@/lib/baseQuinielaDisplay'
import { formatKickoff, isMatchOpenForPredictions } from '@/lib/matchRules'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseQuinielaRoundMatch, PredictedWinner } from '@/types'

const props = defineProps<{
  roundId: string
  userId?: string
  canPredict?: boolean
  roundMatches: BaseQuinielaRoundMatch[]
}>()

const emit = defineEmits<{
  updated: []
}>()

const baseStore = useBaseQuinielaStore()
const formError = ref<string | null>(null)
const savingMatchId = ref<string | null>(null)

const sortedMatches = computed(() =>
  [...props.roundMatches].sort((a, b) => a.position - b.position),
)

function matchCanEdit(matchId: string): boolean {
  if (!props.canPredict || !props.userId) return false
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  return row?.match ? isMatchOpenForPredictions(row.match) : false
}

async function pickWinner(matchId: string, winner: PredictedWinner) {
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  if (!row?.match || !matchCanEdit(matchId) || !props.userId) return

  formError.value = null
  savingMatchId.value = matchId
  try {
    await baseStore.savePrediction(props.roundId, row.match, props.userId, winner)
    emit('updated')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo guardar'
  } finally {
    savingMatchId.value = null
  }
}

function cellClass(
  matchId: string,
  winner: PredictedWinner,
  canEdit: boolean,
): string {
  const prediction = baseStore.getPredictionForMatch(matchId)
  const selected = prediction?.predicted_winner === winner
  const base =
    'flex h-full min-h-[2.5rem] w-full items-center justify-center rounded-md border text-sm font-bold transition-colors'

  if (!canEdit) {
    if (selected) {
      return `${base} border-mundial-accent/50 bg-mundial-accent/15 text-mundial-accent`
    }
    return `${base} border-white/5 bg-black/10 text-slate-600`
  }

  if (selected) {
    return `${base} border-mundial-accent bg-mundial-accent/25 text-mundial-accent`
  }

  return `${base} border-white/10 bg-black/20 text-slate-300 hover:border-mundial-accent/40 hover:bg-mundial-accent/10`
}

function rowStatusClass(row: BaseQuinielaRoundMatch): string {
  const match = row.match
  const prediction = baseStore.getPredictionForMatch(row.match_id)
  if (!match || !prediction || match.status !== 'finished') return ''

  const correct = isPredictionCorrect(prediction.predicted_winner, match)
  if (correct === true) return 'ring-1 ring-mundial-green/40'
  if (correct === false) return 'ring-1 ring-red-500/30'
  return ''
}
</script>

<template>
  <div>
    <p v-if="formError" class="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ formError }}
    </p>

    <div class="overflow-x-auto rounded-xl border border-white/10">
      <table class="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr class="bg-black/40 text-xs uppercase tracking-wider text-slate-400">
            <th class="border border-white/10 px-2 py-2 text-left w-8">#</th>
            <th class="border border-white/10 px-3 py-2 text-left">Partido</th>
            <th class="border border-white/10 px-2 py-2 text-center w-14">L</th>
            <th class="border border-white/10 px-2 py-2 text-center w-14">E</th>
            <th class="border border-white/10 px-2 py-2 text-center w-14">V</th>
            <th class="border border-white/10 px-2 py-2 text-center w-16">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedMatches"
            :key="row.id"
            class="bg-white/[0.02]"
            :class="rowStatusClass(row)"
          >
            <td class="border border-white/10 px-2 py-2 text-center text-slate-500 tabular-nums">
              {{ row.position }}
            </td>
            <td class="border border-white/10 px-3 py-2">
              <div v-if="row.match" class="min-w-0">
                <div class="flex items-center gap-2">
                  <img
                    v-if="row.match.home_team?.flag_url"
                    :src="row.match.home_team.flag_url"
                    :alt="row.match.home_team?.code ?? ''"
                    class="h-4 w-5 shrink-0 rounded object-cover"
                  />
                  <span class="truncate font-medium text-slate-200">
                    {{ row.match.home_team?.code ?? 'LOC' }}
                  </span>
                  <span class="text-slate-500">vs</span>
                  <img
                    v-if="row.match.away_team?.flag_url"
                    :src="row.match.away_team.flag_url"
                    :alt="row.match.away_team?.code ?? ''"
                    class="h-4 w-5 shrink-0 rounded object-cover"
                  />
                  <span class="truncate font-medium text-slate-200">
                    {{ row.match.away_team?.code ?? 'VIS' }}
                  </span>
                  <span
                    v-if="row.match.status !== 'scheduled'"
                    class="ml-auto shrink-0 text-xs font-bold tabular-nums text-mundial-accent"
                  >
                    {{ row.match.home_score }}-{{ row.match.away_score }}
                  </span>
                </div>
                <p v-if="formatKickoff(row.match)" class="mt-0.5 text-xs text-slate-500">
                  {{ formatKickoff(row.match) }}
                </p>
              </div>
            </td>
            <td
              v-for="winner in (['home', 'draw', 'away'] as const)"
              :key="`${row.match_id}-${winner}`"
              class="border border-white/10 p-1"
            >
              <button
                v-if="row.match"
                type="button"
                :class="cellClass(row.match_id, winner, matchCanEdit(row.match_id))"
                :disabled="baseStore.saving || !matchCanEdit(row.match_id)"
                @click="pickWinner(row.match_id, winner)"
              >
                <span v-if="savingMatchId === row.match_id && baseStore.saving">…</span>
                <span v-else-if="baseStore.getPredictionForMatch(row.match_id)?.predicted_winner === winner">
                  ✓
                </span>
                <span v-else>{{ winnerCode(winner) }}</span>
              </button>
            </td>
            <td class="border border-white/10 px-2 py-2 text-center">
              <template v-if="row.match?.status === 'finished'">
                <span
                  v-if="baseStore.getPredictionForMatch(row.match_id)?.points"
                  class="inline-flex items-center gap-0.5 text-xs font-bold text-mundial-green"
                >
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  {{ BASE_QUINIELA_POINTS_PER_HIT }}
                </span>
                <span
                  v-else-if="baseStore.getPredictionForMatch(row.match_id)"
                  class="inline-flex items-center gap-0.5 text-xs text-red-400"
                >
                  <XCircle class="h-3.5 w-3.5" />
                  0
                </span>
                <span v-else class="text-xs text-slate-600">—</span>
              </template>
              <span v-else class="text-xs text-slate-600">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
