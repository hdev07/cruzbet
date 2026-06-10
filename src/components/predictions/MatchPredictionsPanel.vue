<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckCircle2, Pencil, Plus, Trash2 } from '@lucide/vue'
import {
  ENTRY_FEE_MXN,
  MAX_GOAL_PREDICTIONS_PER_MATCH,
  MAX_SCORE_PREDICTIONS_PER_MATCH,
} from '@/constants/quiniela-rules'
import {
  getPredictionStatus,
  isGoalPrediction,
  isScorePrediction,
  predictionSummary,
  statusBadgeClass,
  totalPredictionPoints,
} from '@/lib/predictionDisplay'
import { usePredictionStore } from '@/stores/predictionStore'
import SearchSelect from '@/components/shared/SearchSelect.vue'
import type { Match, Prediction } from '@/types'

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
const showGoalForm = ref(false)
const showScoreForm = ref(false)
const editingGoalId = ref<number | null>(null)
const editingScoreId = ref<number | null>(null)
const predictedMinute = ref<number | ''>('')
const predictedTeam = ref<'home' | 'away'>('home')
const predictedHomeScore = ref<number | ''>('')
const predictedAwayScore = ref<number | ''>('')

const scoreOptions = Array.from({ length: 21 }, (_, index) => ({
  value: index,
  label: String(index),
}))

const minuteOptions = Array.from({ length: 120 }, (_, index) => {
  const minute = index + 1
  return { value: minute, label: String(minute) }
})

const goalPredictions = computed(() => props.predictions.filter(isGoalPrediction))
const scorePredictions = computed(() => props.predictions.filter(isScorePrediction))
const canAddGoal = computed(
  () => props.canPredict && goalPredictions.value.length < MAX_GOAL_PREDICTIONS_PER_MATCH,
)
const canAddScore = computed(
  () => props.canPredict && scorePredictions.value.length < MAX_SCORE_PREDICTIONS_PER_MATCH,
)

const teamOptions = computed(() => [
  {
    value: 'home' as const,
    label: `${props.match.home_team?.name ?? 'Local'} (Local)`,
    image: props.match.home_team?.flag_url ?? undefined,
    imageAlt: props.match.home_team?.name,
  },
  {
    value: 'away' as const,
    label: `${props.match.away_team?.name ?? 'Visitante'} (Visitante)`,
    image: props.match.away_team?.flag_url ?? undefined,
    imageAlt: props.match.away_team?.name,
  },
])

function resetGoalForm() {
  predictedMinute.value = ''
  predictedTeam.value = 'home'
  showGoalForm.value = false
  editingGoalId.value = null
}

function resetScoreForm() {
  predictedHomeScore.value = ''
  predictedAwayScore.value = ''
  showScoreForm.value = false
  editingScoreId.value = null
}

function startEditGoal(pred: Prediction) {
  formError.value = null
  saveSuccess.value = null
  resetScoreForm()
  editingGoalId.value = pred.id
  predictedMinute.value = pred.predicted_minute ?? ''
  predictedTeam.value = pred.predicted_team ?? 'home'
  showGoalForm.value = true
}

function startEditScore(pred: Prediction) {
  formError.value = null
  saveSuccess.value = null
  resetGoalForm()
  editingScoreId.value = pred.id
  predictedHomeScore.value = pred.predicted_home_score ?? ''
  predictedAwayScore.value = pred.predicted_away_score ?? ''
  showScoreForm.value = true
}

function openGoalForm() {
  formError.value = null
  saveSuccess.value = null
  editingGoalId.value = null
  predictedMinute.value = ''
  predictedTeam.value = 'home'
  showGoalForm.value = true
}

function openScoreForm() {
  formError.value = null
  saveSuccess.value = null
  editingScoreId.value = null
  predictedHomeScore.value = ''
  predictedAwayScore.value = ''
  showScoreForm.value = true
}

async function submitGoalPrediction() {
  formError.value = null
  saveSuccess.value = null
  if (predictedMinute.value === '') {
    formError.value = 'Elige el minuto del gol'
    return
  }
  const input = { minute: Number(predictedMinute.value), team: predictedTeam.value }
  try {
    if (editingGoalId.value) {
      await predictionStore.updateGoalPrediction(
        props.match,
        editingGoalId.value,
        input,
        goalPredictions.value,
      )
      saveSuccess.value = 'Predicción de gol actualizada'
    } else {
      await predictionStore.saveGoalPrediction(
        props.match,
        props.userId,
        input,
        goalPredictions.value,
      )
      saveSuccess.value = 'Predicción de gol guardada'
    }
    resetGoalForm()
    emit('updated')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Error al guardar'
  }
}

async function submitScorePrediction() {
  formError.value = null
  saveSuccess.value = null
  if (predictedHomeScore.value === '' || predictedAwayScore.value === '') {
    formError.value = 'Indica el marcador final (local y visitante)'
    return
  }
  const input = {
    homeScore: Number(predictedHomeScore.value),
    awayScore: Number(predictedAwayScore.value),
  }
  try {
    if (editingScoreId.value) {
      await predictionStore.updateScorePrediction(
        props.match,
        editingScoreId.value,
        input,
        scorePredictions.value,
      )
      saveSuccess.value = 'Predicción de marcador actualizada'
    } else {
      await predictionStore.saveScorePrediction(
        props.match,
        props.userId,
        input,
        scorePredictions.value,
      )
      saveSuccess.value = 'Predicción de marcador guardada'
    }
    resetScoreForm()
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
    emit('updated')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Error al eliminar'
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 class="font-semibold">Tus predicciones</h2>
      <p class="mt-1 text-xs text-slate-400">
        Cuota de ${{ ENTRY_FEE_MXN }} MXN por partido.
        <RouterLink to="/reglas" class="text-mundial-accent hover:underline">Datos de pago</RouterLink>
      </p>
      <p v-if="editHint && canPredict" class="mt-1 text-xs text-mundial-accent/90">{{ editHint }}</p>
      <p class="mt-2 text-xs text-slate-500">
        Hasta {{ MAX_GOAL_PREDICTIONS_PER_MATCH }} goles y {{ MAX_SCORE_PREDICTIONS_PER_MATCH }} marcadores por partido.
      </p>
    </div>

    <section class="rounded-xl border border-white/10 bg-white/5 p-5">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-slate-200">
          Predicciones de gol
          <span class="font-normal text-slate-500">({{ goalPredictions.length }}/{{ MAX_GOAL_PREDICTIONS_PER_MATCH }})</span>
        </h3>
        <button
          v-if="canAddGoal && !showGoalForm"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg bg-mundial-accent/20 px-3 py-1.5 text-xs font-semibold text-mundial-accent hover:bg-mundial-accent/30"
          @click="openGoalForm"
        >
          <Plus class="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      <p v-if="!goalPredictions.length" class="text-sm text-slate-500">
        Aún no tienes predicciones de gol.
      </p>

      <ul v-else class="space-y-2">
        <li
          v-for="pred in goalPredictions"
          :key="pred.id"
          class="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-200">{{ predictionSummary(pred, match) }}</p>
            <p class="text-xs text-slate-500">{{ getPredictionStatus(pred, match).detail }}</p>
          </div>
          <span
            v-if="match.status === 'finished' && pred.scored_at"
            class="shrink-0 text-sm font-bold tabular-nums text-mundial-accent"
          >
            {{ totalPredictionPoints(pred) }} pts
          </span>
          <span
            v-else
            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="statusBadgeClass[getPredictionStatus(pred, match).kind]"
          >
            {{ getPredictionStatus(pred, match).label }}
          </span>
          <button
            v-if="canPredict"
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-mundial-accent/20 hover:text-mundial-accent"
            :disabled="predictionStore.saving"
            title="Editar"
            @click="startEditGoal(pred)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            v-if="canPredict"
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
            :disabled="predictionStore.saving"
            title="Eliminar"
            @click="removePrediction(pred.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </li>
      </ul>

      <form
        v-if="showGoalForm && (canAddGoal || editingGoalId)"
        class="mt-4 space-y-3 rounded-lg border border-mundial-accent/30 bg-mundial-accent/5 p-4"
        @submit.prevent="submitGoalPrediction"
      >
        <p v-if="editingGoalId" class="text-xs font-medium text-mundial-accent">Editando predicción de gol</p>
        <div class="space-y-1.5">
          <span class="text-sm text-slate-300">Minuto del gol</span>
          <SearchSelect
            v-model="predictedMinute"
            :options="minuteOptions"
            searchable
            suffix="'"
            placeholder="Buscar minuto"
            empty-message="No hay minutos con ese número"
          />
        </div>
        <div class="space-y-1.5">
          <span class="text-sm text-slate-300">Equipo que marca</span>
          <SearchSelect v-model="predictedTeam" :options="teamOptions" placeholder="Elige el equipo" />
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 rounded-lg bg-mundial-accent py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="predictionStore.saving"
          >
            {{ predictionStore.saving ? 'Guardando...' : editingGoalId ? 'Actualizar gol' : 'Guardar gol' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
            @click="resetGoalForm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-white/10 bg-white/5 p-5">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-slate-200">
          Predicciones de marcador
          <span class="font-normal text-slate-500">({{ scorePredictions.length }}/{{ MAX_SCORE_PREDICTIONS_PER_MATCH }})</span>
        </h3>
        <button
          v-if="canAddScore && !showScoreForm"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg bg-mundial-accent/20 px-3 py-1.5 text-xs font-semibold text-mundial-accent hover:bg-mundial-accent/30"
          @click="openScoreForm"
        >
          <Plus class="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      <p v-if="!scorePredictions.length" class="text-sm text-slate-500">
        Aún no tienes predicciones de marcador.
      </p>

      <ul v-else class="space-y-2">
        <li
          v-for="pred in scorePredictions"
          :key="pred.id"
          class="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-200">{{ predictionSummary(pred, match) }}</p>
            <p class="text-xs text-slate-500">{{ getPredictionStatus(pred, match).detail }}</p>
          </div>
          <span
            v-if="match.status === 'finished' && pred.scored_at"
            class="shrink-0 text-sm font-bold tabular-nums text-mundial-accent"
          >
            {{ totalPredictionPoints(pred) }} pts
          </span>
          <span
            v-else
            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="statusBadgeClass[getPredictionStatus(pred, match).kind]"
          >
            {{ getPredictionStatus(pred, match).label }}
          </span>
          <button
            v-if="canPredict"
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-mundial-accent/20 hover:text-mundial-accent"
            :disabled="predictionStore.saving"
            title="Editar"
            @click="startEditScore(pred)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            v-if="canPredict"
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
            :disabled="predictionStore.saving"
            title="Eliminar"
            @click="removePrediction(pred.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </li>
      </ul>

      <form
        v-if="showScoreForm && (canAddScore || editingScoreId)"
        class="mt-4 space-y-3 rounded-lg border border-mundial-accent/30 bg-mundial-accent/5 p-4"
        @submit.prevent="submitScorePrediction"
      >
        <p v-if="editingScoreId" class="text-xs font-medium text-mundial-accent">Editando predicción de marcador</p>
        <p v-else class="text-xs text-slate-400">Goles de local y visitante al terminar el partido.</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <span class="text-sm text-slate-300">{{ match.home_team?.name ?? 'Local' }}</span>
            <SearchSelect v-model="predictedHomeScore" :options="scoreOptions" placeholder="0" />
          </div>
          <div class="space-y-1.5">
            <span class="text-sm text-slate-300">{{ match.away_team?.name ?? 'Visitante' }}</span>
            <SearchSelect v-model="predictedAwayScore" :options="scoreOptions" placeholder="0" />
          </div>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 rounded-lg bg-mundial-accent py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="predictionStore.saving"
          >
            {{ predictionStore.saving ? 'Guardando...' : editingScoreId ? 'Actualizar marcador' : 'Guardar marcador' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
            @click="resetScoreForm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>

    <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
    <p v-if="saveSuccess" class="inline-flex items-center gap-1.5 text-sm text-mundial-green">
      <CheckCircle2 class="h-4 w-4" />
      {{ saveSuccess }}
    </p>
  </div>
</template>
