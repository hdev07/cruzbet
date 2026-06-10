<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckCircle2, Info, Lightbulb, Pencil, Trash2 } from '@lucide/vue'
import {
  ENTRY_FEE_MXN,
  GOAL_MINUTE_PREDICTION_NOTICE,
  MAX_GOAL_PREDICTIONS_PER_MATCH,
  MAX_SCORE_PREDICTIONS_PER_MATCH,
  PREDICTION_FILL_TIP,
  PREDICTION_SAVE_ALERT,
  PREDICTIONS_REQUIRED_NOTICE,
} from '@/constants/quiniela-rules'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import {
  FIRST_HALF_EXTRA,
  FIRST_HALF_REGULAR,
  NO_GOALS_MINUTE,
  SECOND_HALF_EXTRA,
  SECOND_HALF_REGULAR,
  formatEncodedMinute,
  isNoGoalsMinute,
} from '@/lib/predictionMinutes'
import {
  getPredictionStatus,
  hasCompletePredictions,
  isGoalPrediction,
  isScorePrediction,
  predictionSummary,
  statusBadgeClass,
  totalPredictionPoints,
} from '@/lib/predictionDisplay'
import { usePredictionStore } from '@/stores/predictionStore'
import type { Match, PredictedWinner, Prediction } from '@/types'

const props = defineProps<{
  match: Match
  userId: string
  predictions: Prediction[]
  canPredict: boolean
  editHint: string | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const predictionStore = usePredictionStore()
const formError = ref<string | null>(null)
const saveSuccess = ref<string | null>(null)
const editingGoal = ref(false)
const editingWinner = ref(false)
const selectedMinute = ref<number | null>(null)
const selectedWinner = ref<PredictedWinner | null>(null)
const pendingSave = ref<'goal' | 'score' | null>(null)

const goalPrediction = computed(() => props.predictions.find(isGoalPrediction) ?? null)
const winnerPrediction = computed(() => props.predictions.find(isScorePrediction) ?? null)

const canEditGoal = computed(() => props.canPredict && (!goalPrediction.value || editingGoal.value))
const canEditWinner = computed(() => props.canPredict && (!winnerPrediction.value || editingWinner.value))

const goalsRemaining = computed(() => (goalPrediction.value ? 0 : 1))
const scoresRemaining = computed(() => (winnerPrediction.value ? 0 : 1))
const isComplete = computed(() => hasCompletePredictions(props.predictions))
const allOpportunitiesFilled = computed(() => isComplete.value)
const showFillTip = computed(() => props.canPredict)
const incompleteMessage = computed(() =>
  PREDICTION_FILL_TIP.incomplete(goalsRemaining.value > 0, scoresRemaining.value > 0),
)

const winnerColumns = computed(() => [
  {
    key: 'home' as const,
    code: 'L',
    label: props.match.home_team?.name ?? 'Local',
    flag: props.match.home_team?.flag_url,
  },
  {
    key: 'draw' as const,
    code: 'E',
    label: 'Empate',
    flag: null,
  },
  {
    key: 'away' as const,
    code: 'V',
    label: props.match.away_team?.name ?? 'Visita',
    flag: props.match.away_team?.flag_url,
  },
])

function minuteButtonLabel(encoded: number): string {
  return formatEncodedMinute(encoded).replace("'", '')
}

function selectMinute(encoded: number) {
  if (!canEditGoal.value) return
  selectedMinute.value = encoded
}

function selectNoGoals() {
  if (!canEditGoal.value) return
  selectedMinute.value = NO_GOALS_MINUTE
}

function isNoGoalsSelected(): boolean {
  return selectedMinute.value != null && isNoGoalsMinute(selectedMinute.value)
}

function selectWinner(winner: PredictedWinner) {
  if (!canEditWinner.value) return
  selectedWinner.value = winner
}

function startEditGoal() {
  formError.value = null
  saveSuccess.value = null
  editingGoal.value = true
  selectedMinute.value = goalPrediction.value?.predicted_minute ?? null
}

function startEditWinner() {
  formError.value = null
  saveSuccess.value = null
  editingWinner.value = true
  selectedWinner.value = winnerPrediction.value?.predicted_winner ?? null
}

function cancelGoalEdit() {
  editingGoal.value = false
  selectedMinute.value = null
}

function cancelWinnerEdit() {
  editingWinner.value = false
  selectedWinner.value = null
}

function submitGoalPrediction() {
  formError.value = null
  saveSuccess.value = null
  if (selectedMinute.value == null) {
    formError.value = 'Elige un minuto en la grilla o marca "No habrá goles"'
    return
  }
  if (!goalPrediction.value) {
    pendingSave.value = 'goal'
    return
  }
  void persistGoalPrediction()
}

function submitWinnerPrediction() {
  formError.value = null
  saveSuccess.value = null
  if (!selectedWinner.value) {
    formError.value = 'Marca L, E o V en la tabla'
    return
  }
  if (!winnerPrediction.value) {
    pendingSave.value = 'score'
    return
  }
  void persistWinnerPrediction()
}

function cancelPendingSave() {
  if (predictionStore.saving) return
  pendingSave.value = null
}

async function confirmPendingSave() {
  if (!pendingSave.value) return
  if (pendingSave.value === 'goal') {
    await persistGoalPrediction()
  } else {
    await persistWinnerPrediction()
  }
}

async function persistGoalPrediction() {
  if (selectedMinute.value == null) return
  formError.value = null
  saveSuccess.value = null
  const input = { minute: selectedMinute.value }
  try {
    if (goalPrediction.value) {
      await predictionStore.updateGoalPrediction(
        props.match,
        goalPrediction.value.id,
        input,
        goalPrediction.value ? [goalPrediction.value] : [],
      )
      saveSuccess.value = 'Minuto del primer gol actualizado'
    } else {
      await predictionStore.saveGoalPrediction(
        props.match,
        props.userId,
        input,
        [],
      )
      saveSuccess.value = 'Minuto del primer gol guardado'
    }
    pendingSave.value = null
    editingGoal.value = false
    emit('updated')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Error al guardar'
  }
}

async function persistWinnerPrediction() {
  if (!selectedWinner.value) return
  formError.value = null
  saveSuccess.value = null
  const input = { winner: selectedWinner.value }
  try {
    if (winnerPrediction.value) {
      await predictionStore.updateWinnerPrediction(
        props.match,
        winnerPrediction.value.id,
        input,
        winnerPrediction.value ? [winnerPrediction.value] : [],
      )
      saveSuccess.value = 'Ganador actualizado'
    } else {
      await predictionStore.saveWinnerPrediction(
        props.match,
        props.userId,
        input,
        [],
      )
      saveSuccess.value = 'Ganador guardado'
    }
    pendingSave.value = null
    editingWinner.value = false
    emit('updated')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Error al guardar'
  }
}

async function removePrediction(id: number) {
  formError.value = null
  saveSuccess.value = null
  try {
    await predictionStore.deletePrediction(props.match, id)
    if (goalPrediction.value?.id === id) {
      editingGoal.value = false
      selectedMinute.value = null
    }
    if (winnerPrediction.value?.id === id) {
      editingWinner.value = false
      selectedWinner.value = null
    }
    emit('updated')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Error al eliminar'
  }
}

function noGoalsCellClass(): string {
  const selected = isNoGoalsSelected()
  const saved = !editingGoal.value && isNoGoalsMinute(goalPrediction.value?.predicted_minute ?? -1)
  const base =
    'w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors'
  if (!canEditGoal.value) {
    return `${base} border-white/5 bg-black/20 text-slate-500`
  }
  if (selected || saved) {
    return `${base} border-mundial-accent bg-mundial-accent/25 text-mundial-accent`
  }
  return `${base} border-white/10 bg-black/20 text-slate-300 hover:border-mundial-accent/40 hover:bg-mundial-accent/10`
}

function minuteCellClass(encoded: number): string {
  const selected = selectedMinute.value === encoded
  const saved = !editingGoal.value && goalPrediction.value?.predicted_minute === encoded
  const base =
    'rounded-md border px-1 py-1.5 text-center text-xs font-medium tabular-nums transition-colors'
  if (!canEditGoal.value) {
    return `${base} border-white/5 bg-black/20 text-slate-500`
  }
  if (selected || saved) {
    return `${base} border-mundial-accent bg-mundial-accent/25 text-mundial-accent`
  }
  return `${base} border-white/10 bg-black/20 text-slate-300 hover:border-mundial-accent/40 hover:bg-mundial-accent/10`
}

function winnerCellClass(winner: PredictedWinner): string {
  const selected = selectedWinner.value === winner
  const saved = !editingWinner.value && winnerPrediction.value?.predicted_winner === winner
  const base =
    'w-full rounded-lg border px-3 py-4 text-center transition-colors'
  if (!canEditWinner.value) {
    return `${base} border-white/5 bg-black/20 text-slate-500`
  }
  if (selected || saved) {
    return `${base} border-mundial-accent bg-mundial-accent/25 text-mundial-accent`
  }
  return `${base} border-white/10 bg-black/20 text-slate-200 hover:border-mundial-accent/40 hover:bg-mundial-accent/10`
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 class="font-semibold">Tus predicciones</h2>
      <p class="mt-1 text-xs text-slate-400">
        Cuota de ${{ ENTRY_FEE_MXN }} MXN por partido.
        <RouterLink to="/quiniela-partido/reglas" class="text-mundial-accent hover:underline">Datos de pago</RouterLink>
      </p>
      <p v-if="editHint && canPredict" class="mt-1 text-xs text-mundial-accent/90">{{ editHint }}</p>
      <p class="mt-2 text-xs font-medium text-slate-300">
        {{ PREDICTIONS_REQUIRED_NOTICE }}
      </p>

      <div
        v-if="showFillTip && isComplete"
        class="mt-3 flex gap-2 rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-3 py-2.5 text-sm text-mundial-green"
      >
        <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" />
        <p>{{ PREDICTION_FILL_TIP.allFilled }}</p>
      </div>
      <div
        v-else-if="showFillTip"
        class="mt-3 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100"
      >
        <Lightbulb class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p class="font-semibold text-amber-200">{{ PREDICTION_FILL_TIP.title }}</p>
          <p class="mt-0.5 text-amber-100/90">{{ incompleteMessage }}</p>
        </div>
      </div>
      <div
        v-else-if="!isComplete && props.predictions.length"
        class="mt-3 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
      >
        <p>Predicciones incompletas: no participas en el ranking de este partido hasta tener ambas apuestas.</p>
      </div>
    </div>

    <section class="rounded-xl border border-white/10 bg-white/5 p-5">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-slate-200">
          Minuto del primer gol
          <span class="font-normal text-slate-500">({{ goalPrediction ? 1 : 0 }}/{{ MAX_GOAL_PREDICTIONS_PER_MATCH }})</span>
        </h3>
        <div v-if="canPredict && goalPrediction && !editingGoal" class="flex gap-1">
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-mundial-accent/20 hover:text-mundial-accent"
            :disabled="predictionStore.saving"
            title="Editar"
            @click="startEditGoal"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
            :disabled="predictionStore.saving"
            title="Eliminar"
            @click="removePrediction(goalPrediction.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <p class="mb-3 text-xs text-slate-400">
        Elige cuándo cae el <strong class="font-medium text-slate-300">primer gol</strong>. No importa quién lo mete.
      </p>

      <div
        class="mb-3 flex gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-xs text-sky-100"
      >
        <Info class="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <div>
          <p class="font-semibold text-sky-200">{{ GOAL_MINUTE_PREDICTION_NOTICE.title }}</p>
          <ul class="mt-1.5 list-disc space-y-1 pl-4 text-sky-100/90">
            <li v-for="bullet in GOAL_MINUTE_PREDICTION_NOTICE.bullets" :key="bullet">
              {{ bullet }}
            </li>
          </ul>
        </div>
      </div>

      <p
        v-if="canPredict && goalsRemaining > 0 && !editingGoal"
        class="mb-3 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90"
      >
        💡 {{ PREDICTION_FILL_TIP.goalsRemaining() }}
      </p>

      <div
        v-if="goalPrediction && !editingGoal"
        class="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-200">{{ predictionSummary(goalPrediction, match) }}</p>
          <p class="text-xs text-slate-500">{{ getPredictionStatus(goalPrediction, match).detail }}</p>
        </div>
        <span
          v-if="match.status === 'finished' && goalPrediction.scored_at"
          class="shrink-0 text-sm font-bold tabular-nums text-mundial-accent"
        >
          {{ totalPredictionPoints(goalPrediction) }} pts
        </span>
        <span
          v-else
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="statusBadgeClass[getPredictionStatus(goalPrediction, match).kind]"
        >
          {{ getPredictionStatus(goalPrediction, match).label }}
        </span>
      </div>

      <div v-if="canEditGoal" class="space-y-4">
        <button
          type="button"
          :class="noGoalsCellClass()"
          :disabled="predictionStore.saving"
          @click="selectNoGoals"
        >
          <span class="mr-2">0️⃣</span>
          No habrá goles
          <span v-if="isNoGoalsSelected()" class="ml-2 text-xs">✓</span>
        </button>

        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Primer tiempo</p>
          <div class="grid grid-cols-9 gap-1 md:grid-cols-15">
            <button
              v-for="m in FIRST_HALF_REGULAR"
              :key="`1t-${m}`"
              type="button"
              :class="minuteCellClass(m)"
              :disabled="predictionStore.saving"
              @click="selectMinute(m)"
            >
              {{ minuteButtonLabel(m) }}
            </button>
          </div>
          <p class="mt-2 mb-1 text-xs text-slate-500">Tiempo extra 1er tiempo</p>
          <div class="grid grid-cols-5 gap-1 md:grid-cols-10">
            <button
              v-for="m in FIRST_HALF_EXTRA"
              :key="`1t-extra-${m}`"
              type="button"
              :class="minuteCellClass(m)"
              :disabled="predictionStore.saving"
              @click="selectMinute(m)"
            >
              {{ minuteButtonLabel(m) }}
            </button>
          </div>
        </div>

        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Segundo tiempo</p>
          <div class="grid grid-cols-9 gap-1 md:grid-cols-15">
            <button
              v-for="m in SECOND_HALF_REGULAR"
              :key="`2t-${m}`"
              type="button"
              :class="minuteCellClass(m)"
              :disabled="predictionStore.saving"
              @click="selectMinute(m)"
            >
              {{ minuteButtonLabel(m) }}
            </button>
          </div>
          <p class="mt-2 mb-1 text-xs text-slate-500">Tiempo extra 2do tiempo</p>
          <div class="grid grid-cols-5 gap-1 md:grid-cols-10">
            <button
              v-for="m in SECOND_HALF_EXTRA"
              :key="`2t-extra-${m}`"
              type="button"
              :class="minuteCellClass(m)"
              :disabled="predictionStore.saving"
              @click="selectMinute(m)"
            >
              {{ minuteButtonLabel(m) }}
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg bg-mundial-accent py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="predictionStore.saving || selectedMinute == null"
            @click="submitGoalPrediction"
          >
            {{ predictionStore.saving ? 'Guardando...' : goalPrediction ? 'Actualizar minuto' : 'Guardar minuto' }}
          </button>
          <button
            v-if="editingGoal"
            type="button"
            class="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
            @click="cancelGoalEdit"
          >
            Cancelar
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-white/10 bg-white/5 p-5">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-slate-200">
          ¿Quién gana?
          <span class="font-normal text-slate-500">({{ winnerPrediction ? 1 : 0 }}/{{ MAX_SCORE_PREDICTIONS_PER_MATCH }})</span>
        </h3>
        <div v-if="canPredict && winnerPrediction && !editingWinner" class="flex gap-1">
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-mundial-accent/20 hover:text-mundial-accent"
            :disabled="predictionStore.saving"
            title="Editar"
            @click="startEditWinner"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
            :disabled="predictionStore.saving"
            title="Eliminar"
            @click="removePrediction(winnerPrediction.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <p
        v-if="canPredict && scoresRemaining > 0 && !editingWinner"
        class="mb-3 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90"
      >
        💡 {{ PREDICTION_FILL_TIP.scoresRemaining() }}
      </p>

      <div
        v-if="winnerPrediction && !editingWinner"
        class="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-200">{{ predictionSummary(winnerPrediction, match) }}</p>
          <p class="text-xs text-slate-500">{{ getPredictionStatus(winnerPrediction, match).detail }}</p>
        </div>
        <span
          v-if="match.status === 'finished' && winnerPrediction.scored_at"
          class="shrink-0 text-sm font-bold tabular-nums text-mundial-accent"
        >
          {{ totalPredictionPoints(winnerPrediction) }} pts
        </span>
        <span
          v-else
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="statusBadgeClass[getPredictionStatus(winnerPrediction, match).kind]"
        >
          {{ getPredictionStatus(winnerPrediction, match).label }}
        </span>
      </div>

      <div v-if="canEditWinner" class="overflow-x-auto">
        <table class="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                v-for="col in winnerColumns"
                :key="col.key"
                class="border border-white/10 bg-black/30 px-2 py-2 text-center"
              >
                <span class="block text-lg font-bold text-mundial-accent">{{ col.code }}</span>
                <span class="mt-0.5 block text-xs font-normal text-slate-400">{{ col.label }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                v-for="col in winnerColumns"
                :key="`pick-${col.key}`"
                class="border border-white/10 p-2"
              >
                <button
                  type="button"
                  :class="winnerCellClass(col.key)"
                  :disabled="predictionStore.saving"
                  @click="selectWinner(col.key)"
                >
                  <img
                    v-if="col.flag"
                    :src="col.flag"
                    :alt="col.label"
                    class="mx-auto mb-1 h-6 w-8 rounded object-cover"
                  />
                  <span v-else class="mb-1 block text-2xl">🤝</span>
                  <span class="block text-xs font-semibold">
                    {{ selectedWinner === col.key || (!editingWinner && winnerPrediction?.predicted_winner === col.key) ? '✓' : 'Marcar' }}
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg bg-mundial-accent py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="predictionStore.saving || !selectedWinner"
            @click="submitWinnerPrediction"
          >
            {{ predictionStore.saving ? 'Guardando...' : winnerPrediction ? 'Actualizar ganador' : 'Guardar ganador' }}
          </button>
          <button
            v-if="editingWinner"
            type="button"
            class="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
            @click="cancelWinnerEdit"
          >
            Cancelar
          </button>
        </div>
      </div>
    </section>

    <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
    <p v-if="saveSuccess" class="inline-flex items-center gap-1.5 text-sm text-mundial-green">
      <CheckCircle2 class="h-4 w-4" />
      {{ saveSuccess }}
    </p>

    <ConfirmModal
      :open="pendingSave === 'goal'"
      :title="PREDICTION_SAVE_ALERT.goal.title"
      :subtitle="PREDICTION_SAVE_ALERT.goal.subtitle"
      :sections="PREDICTION_SAVE_ALERT.goal.sections"
      :examples="PREDICTION_SAVE_ALERT.goal.examples"
      examples-title="Ejemplo para que quede claro"
      :confirm-label="PREDICTION_SAVE_ALERT.goal.confirm"
      :saving="predictionStore.saving"
      @confirm="confirmPendingSave"
      @cancel="cancelPendingSave"
    />
    <ConfirmModal
      :open="pendingSave === 'score'"
      :title="PREDICTION_SAVE_ALERT.score.title"
      :subtitle="PREDICTION_SAVE_ALERT.score.subtitle"
      :sections="PREDICTION_SAVE_ALERT.score.sections"
      :examples="PREDICTION_SAVE_ALERT.score.examples"
      examples-title="Ejemplo para que quede claro"
      :confirm-label="PREDICTION_SAVE_ALERT.score.confirm"
      :saving="predictionStore.saving"
      @confirm="confirmPendingSave"
      @cancel="cancelPendingSave"
    />
  </div>
</template>
