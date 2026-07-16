<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, Info, Lock, XCircle } from '@lucide/vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import {
  baseQuinielaFillTip,
  baseQuinielaSaveAlert,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { BASE_WINNER_OPTIONS, isPredictionCorrect } from '@/lib/baseQuinielaDisplay'
import {
  formatKickoff,
  isMatchOpenForPredictions,
  teamsPendingReason,
} from '@/lib/matchRules'
import { teamDisplayName, resolveTeamCrest } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseQuinielaRoundMatch, PredictedWinner } from '@/types'

const props = defineProps<{
  roundId: string
  userId?: string
  canPredict?: boolean
  roundMatches: BaseQuinielaRoundMatch[]
  matchCount?: number
}>()


const baseStore = useBaseQuinielaStore()
const formError = ref<string | null>(null)
const savingMatchId = ref<string | null>(null)
const showSubmitModal = ref(false)

const sortedMatches = computed(() =>
  [...props.roundMatches].sort((a, b) => a.position - b.position),
)

const totalMatches = computed(
  () => props.matchCount ?? (sortedMatches.value.length || BASE_QUINIELA_MATCHES_PER_ROUND),
)

const fillTip = computed(() => baseQuinielaFillTip(totalMatches.value))
const saveAlert = computed(() => baseQuinielaSaveAlert(totalMatches.value))

function teamSideFlag(
  match: NonNullable<BaseQuinielaRoundMatch['match']>,
  side: 'home' | 'away',
): string | null {
  const team = side === 'home' ? match.home_team : match.away_team
  return resolveTeamCrest(team)
}

function teamSideCode(
  match: NonNullable<BaseQuinielaRoundMatch['match']>,
  side: 'home' | 'away',
): string | null {
  const team = side === 'home' ? match.home_team : match.away_team
  return team?.code ?? null
}

function teamSideLabel(match: NonNullable<BaseQuinielaRoundMatch['match']>, side: 'home' | 'away'): string {
  const team = side === 'home' ? match.home_team : match.away_team
  return teamDisplayName(team, side === 'home' ? 'Local' : 'Visitante')
}

const isComplete = computed(() => {
  const total = sortedMatches.value.length
  if (!total) return false
  const filled = sortedMatches.value.filter((row) =>
    baseStore.getPredictionForMatch(row.match_id),
  ).length
  return filled === total
})

const filledCount = computed(
  () =>
    sortedMatches.value.filter((row) => baseStore.getPredictionForMatch(row.match_id)).length,
)

const isSubmitted = computed(() => baseStore.isQuinielaSubmitted())

function matchCanEdit(matchId: string): boolean {
  if (!props.canPredict || !props.userId || isSubmitted.value) return false
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  return row?.match ? isMatchOpenForPredictions(row.match) : false
}

async function pickWinner(matchId: string, winner: PredictedWinner) {
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  if (!row?.match || !matchCanEdit(matchId) || !props.userId) return
  if (savingMatchId.value) return

  const existing = baseStore.getPredictionForMatch(matchId)
  // Evita doble click / re-click en la misma opción
  if (existing?.predicted_winner === winner) return

  const wasEmpty = !existing
  const filledBefore = sortedMatches.value.filter((r) =>
    baseStore.getPredictionForMatch(r.match_id),
  ).length
  const total = sortedMatches.value.length

  formError.value = null
  savingMatchId.value = matchId
  try {
    await baseStore.savePrediction(props.roundId, row.match, props.userId, winner)
    // Solo abrir modal al completar el ÚLTIMO partido pendiente (no al cambiar un pick)
    if (wasEmpty && total > 0 && filledBefore === total - 1 && !isSubmitted.value) {
      showSubmitModal.value = true
    }
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo guardar'
  } finally {
    savingMatchId.value = null
  }
}

function openSubmitModal() {
  if (!isComplete.value || isSubmitted.value) return
  showSubmitModal.value = true
}

function cancelSubmitModal() {
  showSubmitModal.value = false
}

async function confirmSubmitQuiniela() {
  if (!props.userId) return
  formError.value = null
  try {
    await baseStore.submitQuiniela(props.roundId, props.userId)
    showSubmitModal.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo guardar la quiniela'
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

function mobileCellClass(
  matchId: string,
  winner: PredictedWinner,
  canEdit: boolean,
): string {
  const prediction = baseStore.getPredictionForMatch(matchId)
  const selected = prediction?.predicted_winner === winner
  const base =
    'flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 text-center transition-colors'

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
  <div class="relative pb-20 md:pb-0">
    <div
      v-if="canPredict && isSubmitted"
      class="mb-4 flex gap-2 rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-3 py-2.5 text-sm text-mundial-green"
    >
      <Lock class="mt-0.5 h-4 w-4 shrink-0" />
      <p>{{ fillTip.submitted }}</p>
    </div>

    <div
      v-else-if="canPredict && isComplete"
      class="mb-4 flex gap-2 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-3 py-2.5 text-sm text-mundial-accent"
    >
      <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" />
      <p>{{ fillTip.readyToSubmit }}</p>
    </div>

    <div
      v-else-if="canPredict"
      class="mb-4 flex gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300"
    >
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-mundial-accent" />
      <p>{{ fillTip.draft }}</p>
    </div>

    <p v-if="formError" class="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ formError }}
    </p>

    <!-- Móvil: tarjetas sin scroll horizontal -->
    <div class="space-y-3 md:hidden">
      <article
        v-for="row in sortedMatches"
        :key="`mobile-${row.id}`"
        class="rounded-xl border border-white/10 bg-white/[0.02] p-3"
        :class="rowStatusClass(row)"
      >
        <div v-if="row.match" class="mb-3">
          <div class="mb-1 flex items-center gap-2">
            <Lock
              v-if="isSubmitted && baseStore.getPredictionForMatch(row.match_id)"
              class="h-3.5 w-3.5 text-mundial-accent"
            />
            <span class="text-xs font-semibold tabular-nums text-slate-500">#{{ row.position }}</span>
            <span
              v-if="row.match.status !== 'scheduled'"
              class="ml-auto text-xs font-bold tabular-nums text-mundial-accent"
            >
              {{ row.match.home_score }}-{{ row.match.away_score }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <TeamFlag
              :src="teamSideFlag(row.match, 'home')"
              :code="teamSideCode(row.match, 'home')"
              :alt="teamDisplayName(row.match.home_team, 'Local')"
              size="sm"
            />
            <span class="truncate font-medium text-slate-200">
              {{ teamSideLabel(row.match, 'home') }}
            </span>
            <span class="text-slate-500">vs</span>
            <TeamFlag
              :src="teamSideFlag(row.match, 'away')"
              :code="teamSideCode(row.match, 'away')"
              :alt="teamDisplayName(row.match.away_team, 'Visitante')"
              size="sm"
            />
            <span class="truncate font-medium text-slate-200">
              {{ teamSideLabel(row.match, 'away') }}
            </span>
          </div>

          <p v-if="formatKickoff(row.match)" class="mt-1 text-xs text-slate-500">
            {{ formatKickoff(row.match) }}
          </p>

          <p
            v-if="teamsPendingReason(row.match)"
            class="mt-1 flex items-center gap-1 text-xs text-amber-300/90"
          >
            <Lock class="h-3 w-3 shrink-0" />
            {{ teamsPendingReason(row.match) }}
          </p>

        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in BASE_WINNER_OPTIONS"
            :key="`${row.match_id}-mobile-${option.key}`"
            v-show="row.match"
            type="button"
            :class="mobileCellClass(row.match_id, option.key, matchCanEdit(row.match_id))"
            :disabled="baseStore.saving || !matchCanEdit(row.match_id)"
            @click="pickWinner(row.match_id, option.key)"
          >
            <span class="text-xs font-bold uppercase tracking-wide text-mundial-accent/80">
              {{ option.code }}
            </span>
            <span class="text-xs font-semibold leading-tight">
              <template v-if="savingMatchId === row.match_id && baseStore.saving">…</template>
              <template
                v-else-if="baseStore.getPredictionForMatch(row.match_id)?.predicted_winner === option.key"
              >
                ✓ {{ option.label }}
              </template>
              <template v-else>{{ option.label }}</template>
            </span>
          </button>
        </div>

        <div
          v-if="row.match?.status === 'finished' && baseStore.getPredictionForMatch(row.match_id)"
          class="mt-3 flex items-center justify-end gap-1 text-xs"
        >
          <template v-if="baseStore.getPredictionForMatch(row.match_id)?.points">
            <CheckCircle2 class="h-3.5 w-3.5 text-mundial-green" />
            <span class="font-bold text-mundial-green">{{ BASE_QUINIELA_POINTS_PER_HIT }} pts</span>
          </template>
          <template v-else>
            <XCircle class="h-3.5 w-3.5 text-red-400" />
            <span class="text-red-400">0 pts</span>
          </template>
        </div>
      </article>
    </div>

    <!-- Escritorio: tabla -->
    <div class="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-black/40 text-xs uppercase tracking-wider text-slate-400">
            <th class="w-8 border border-white/10 px-2 py-2 text-left">#</th>
            <th class="border border-white/10 px-3 py-2 text-left">Partido</th>
            <th
              v-for="option in BASE_WINNER_OPTIONS"
              :key="`head-${option.key}`"
              class="w-24 border border-white/10 px-2 py-2 text-center"
            >
              <span class="block text-sm font-bold text-mundial-accent">{{ option.code }}</span>
              <span class="mt-0.5 block text-[0.65rem] font-normal normal-case text-slate-400">
                {{ option.label }}
              </span>
            </th>
            <th class="w-16 border border-white/10 px-2 py-2 text-center">Pts</th>
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
              <span class="inline-flex items-center gap-1">
                <Lock
                  v-if="isSubmitted && baseStore.getPredictionForMatch(row.match_id)"
                  class="h-3 w-3 text-mundial-accent"
                />
                {{ row.position }}
              </span>
            </td>
            <td class="border border-white/10 px-3 py-2">
              <div v-if="row.match" class="min-w-0">
                <div class="flex items-center gap-2">
                  <TeamFlag
                    :src="teamSideFlag(row.match, 'home')"
                    :code="teamSideCode(row.match, 'home')"
                    :alt="teamDisplayName(row.match.home_team, 'Local')"
                    size="sm"
                  />
                  <span class="truncate font-medium text-slate-200">
                    {{ teamSideLabel(row.match, 'home') }}
                  </span>
                  <span class="text-slate-500">vs</span>
                  <TeamFlag
                    :src="teamSideFlag(row.match, 'away')"
                    :code="teamSideCode(row.match, 'away')"
                    :alt="teamDisplayName(row.match.away_team, 'Visitante')"
                    size="sm"
                  />
                  <span class="truncate font-medium text-slate-200">
                    {{ teamSideLabel(row.match, 'away') }}
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
                <p
                  v-if="teamsPendingReason(row.match)"
                  class="mt-1 flex items-center gap-1 text-xs text-amber-300/90"
                >
                  <Lock class="h-3 w-3 shrink-0" />
                  {{ teamsPendingReason(row.match) }}
                </p>
              </div>
            </td>
            <td
              v-for="option in BASE_WINNER_OPTIONS"
              :key="`${row.match_id}-${option.key}`"
              class="border border-white/10 p-1"
            >
              <button
                v-if="row.match"
                type="button"
                :class="cellClass(row.match_id, option.key, matchCanEdit(row.match_id))"
                :disabled="baseStore.saving || !matchCanEdit(row.match_id)"
                @click="pickWinner(row.match_id, option.key)"
              >
                <span v-if="savingMatchId === row.match_id && baseStore.saving">…</span>
                <span
                  v-else-if="baseStore.getPredictionForMatch(row.match_id)?.predicted_winner === option.key"
                >
                  ✓
                </span>
                <span v-else class="text-xs">{{ option.label }}</span>
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

    <ConfirmModal
      :open="showSubmitModal"
      :title="saveAlert.title"
      :subtitle="saveAlert.subtitle"
      :sections="saveAlert.sections"
      :confirm-label="saveAlert.confirm"
      :saving="baseStore.saving"
      @confirm="confirmSubmitQuiniela"
      @cancel="cancelSubmitModal"
    />

    <!-- Botón fijo: siempre visible mientras se puede guardar -->
    <div
      v-if="canPredict && !isSubmitted"
      class="pointer-events-none fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-30 px-4 md:static md:inset-auto md:mt-4 md:px-0"
    >
      <div class="pointer-events-auto mx-auto max-w-lg md:max-w-none">
        <button
          type="button"
          class="w-full rounded-xl bg-mundial-accent px-4 py-3.5 text-sm font-bold text-mundial-dark shadow-lg shadow-black/30 hover:bg-mundial-accent/90 disabled:cursor-not-allowed disabled:opacity-45 md:w-auto md:shadow-none"
          :disabled="baseStore.saving || !isComplete"
          @click="openSubmitModal"
        >
          <template v-if="baseStore.saving">Guardando...</template>
          <template v-else-if="isComplete">Guardar quiniela</template>
          <template v-else>
            Guardar quiniela ({{ filledCount }}/{{ sortedMatches.length }})
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
