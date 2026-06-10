<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/types'

const props = defineProps<{
  match: Match
}>()

const matchStore = useMatchStore()

const currentMinute = ref(0)
const homeScore = ref(0)
const awayScore = ref(0)
const goalTeamId = ref('')
const goalMinute = ref(1)
const goalSecond = ref(0)
const saving = ref(false)
const message = ref('')
const error = ref('')

function syncForm(match: Match) {
  currentMinute.value = match.current_minute ?? 0
  homeScore.value = match.home_score
  awayScore.value = match.away_score
  goalMinute.value = Math.max((match.current_minute ?? 0) + 1, 1)
  goalSecond.value = 0
  goalTeamId.value = match.home_team_id
}

watch(
  () => props.match,
  (match) => {
    if (match) syncForm(match)
  },
  { immediate: true },
)

async function startLive() {
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'live', current_minute: 0, home_score: 0, away_score: 0 })
    .eq('id', props.match.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Partido iniciado — predicciones cerradas'
    await matchStore.fetchMatches()
  }
}

async function updateLiveState() {
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({
      current_minute: currentMinute.value,
      home_score: homeScore.value,
      away_score: awayScore.value,
    })
    .eq('id', props.match.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Marcador y minuto actualizados'
    await matchStore.fetchMatches()
  }
}

async function registerGoal() {
  if (!goalTeamId.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase.from('match_events').insert({
    match_id: props.match.id,
    team_id: goalTeamId.value,
    event_type: 'goal',
    minute: goalMinute.value,
    extra_time: 0,
    event_second: goalSecond.value,
    metadata: { type: 'foot' },
  })
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value =
    goalSecond.value > 0
      ? `Gol al ${goalMinute.value}:${String(goalSecond.value).padStart(2, '0')} registrado`
      : `Gol al ${goalMinute.value}' registrado`
  await matchStore.fetchMatches()
}

async function finishMatch() {
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', props.match.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Partido finalizado — puntos calculados'
    await matchStore.fetchMatches()
  }
}
</script>

<template>
  <div class="space-y-3">
    <button
      v-if="match.status === 'scheduled'"
      type="button"
      class="w-full rounded-lg bg-mundial-green py-2.5 text-sm font-semibold disabled:opacity-50"
      :disabled="saving"
      @click="startLive"
    >
      Iniciar partido
    </button>

    <template v-if="match.status === 'live'">
      <section class="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <h3 class="text-sm font-semibold">Marcador y minuto</h3>
        <div class="grid grid-cols-3 gap-2">
          <label class="block text-xs">
            Min
            <input
              v-model.number="currentMinute"
              type="number"
              min="0"
              max="120"
              class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-sm"
            />
          </label>
          <label class="block text-xs">
            Local
            <input
              v-model.number="homeScore"
              type="number"
              min="0"
              class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-sm"
            />
          </label>
          <label class="block text-xs">
            Visita
            <input
              v-model.number="awayScore"
              type="number"
              min="0"
              class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          class="w-full rounded-lg bg-slate-600 py-2 text-xs font-semibold disabled:opacity-50"
          :disabled="saving"
          @click="updateLiveState"
        >
          Actualizar marcador
        </button>
      </section>

      <section class="space-y-3 rounded-lg border border-mundial-accent/30 bg-mundial-accent/5 p-3">
        <h3 class="text-sm font-semibold text-mundial-accent">Registrar gol</h3>
        <div class="grid grid-cols-3 gap-2">
          <label class="block text-xs">
            Equipo
            <select
              v-model="goalTeamId"
              class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-sm"
            >
              <option :value="match.home_team_id">{{ match.home_team?.name }}</option>
              <option :value="match.away_team_id">{{ match.away_team?.name }}</option>
            </select>
          </label>
          <label class="block text-xs">
            Minuto
            <input
              v-model.number="goalMinute"
              type="number"
              min="1"
              max="120"
              class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-sm"
            />
          </label>
          <label class="block text-xs">
            Segundos
            <input
              v-model.number="goalSecond"
              type="number"
              min="0"
              max="59"
              class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <p class="text-xs text-slate-500">
          Desde el segundo 30 cuenta como el siguiente minuto para puntuar (ej. 34:45 → casillero 35).
        </p>
        <button
          type="button"
          class="w-full rounded-lg bg-mundial-accent py-2 text-xs font-semibold disabled:opacity-50"
          :disabled="saving"
          @click="registerGoal"
        >
          Registrar gol
        </button>
      </section>

      <button
        type="button"
        class="w-full rounded-lg border border-white/20 py-2 text-xs text-slate-400 hover:bg-white/5"
        :disabled="saving"
        @click="finishMatch"
      >
        Finalizar partido
      </button>
    </template>

    <p v-if="match.status === 'finished'" class="text-center text-xs text-slate-500">
      Partido cerrado.
    </p>

    <p v-if="message" class="text-xs text-mundial-green">{{ message }}</p>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>
