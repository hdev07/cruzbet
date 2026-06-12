<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { teamDisplayName } from '@/lib/teamDisplay'
import { triggerLiveSync } from '@/lib/liveSync'
import { useMatchStore } from '@/stores/matchStore'
import type { Match, MatchEvent } from '@/types'

const props = defineProps<{
  match: Match
  mobile?: boolean
}>()

const matchStore = useMatchStore()

const currentMinute = ref(0)
const homeScore = ref(0)
const awayScore = ref(0)
const goalTeamId = ref('')
const goalMinute = ref(1)
const goalSecond = ref(0)
const goalExtraTime = ref(0)
const saving = ref(false)
const message = ref('')
const error = ref('')
const events = ref<MatchEvent[]>([])
const editingEventId = ref<string | null>(null)
const editMinute = ref(1)
const editSecond = ref(0)
const editExtraTime = ref(0)
const editTeamId = ref('')
const autoSyncEnabled = ref(true)
const showManualControls = ref(false)

const btnPrimary = computed(() =>
  props.mobile
    ? 'w-full rounded-xl py-3.5 text-base font-semibold disabled:opacity-50'
    : 'w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50',
)
const btnSecondary = computed(() =>
  props.mobile
    ? 'w-full rounded-xl py-3 text-sm font-medium disabled:opacity-50'
    : 'w-full rounded-lg py-2 text-xs font-medium disabled:opacity-50',
)
const formGrid = computed(() =>
  props.mobile ? 'grid grid-cols-1 gap-3 sm:grid-cols-3' : 'grid grid-cols-3 gap-2',
)
const inputClass =
  'mt-1.5 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2.5 text-base md:py-1.5 md:text-sm'
const canManage = computed(() => props.match.status === 'live')
const isFinished = computed(() => props.match.status === 'finished')
const isAutoSyncOn = computed(() => autoSyncEnabled.value !== false)

function formatSyncTime(iso: string | null | undefined) {
  if (!iso) return 'Aún no'
  return new Date(iso).toLocaleString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const sortedEvents = computed(() =>
  [...events.value]
    .filter((e) => e.event_type === 'goal')
    .sort(
      (a, b) =>
        a.minute - b.minute ||
        a.extra_time - b.extra_time ||
        (a.event_second ?? 0) - (b.event_second ?? 0),
    ),
)

function teamLabel(teamId: string | null) {
  if (!teamId) return '—'
  if (teamId === props.match.home_team_id) return teamDisplayName(props.match.home_team, 'Local')
  if (teamId === props.match.away_team_id) return teamDisplayName(props.match.away_team, 'Visita')
  return '—'
}

function formatGoalTime(minute: number, second: number, extraTime = 0) {
  if (extraTime > 0) {
    const suffix = second > 0 ? `:${String(second).padStart(2, '0')}` : ''
    return `${minute}+${extraTime}${suffix}'`
  }
  if (second > 0) return `${minute}:${String(second).padStart(2, '0')}`
  return `${minute}'`
}

function syncForm(match: Match) {
  currentMinute.value = match.current_minute ?? 0
  homeScore.value = match.home_score
  awayScore.value = match.away_score
  goalMinute.value = Math.max((match.current_minute ?? 0) + 1, 1)
  goalSecond.value = 0
  goalExtraTime.value = 0
  goalTeamId.value = match.home_team_id
  autoSyncEnabled.value = match.auto_sync_enabled !== false
}

async function loadEvents() {
  const { data, error: err } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', props.match.id)
    .eq('event_type', 'goal')
    .order('minute', { ascending: true })
    .order('extra_time', { ascending: true })

  if (!err && data) events.value = data as MatchEvent[]
}

watch(
  () => props.match,
  (match) => {
    if (match) {
      syncForm(match)
      void loadEvents()
    }
  },
  { immediate: true },
)

async function syncNow() {
  saving.value = true
  error.value = ''
  const result = await triggerLiveSync()
  saving.value = false
  if (!result.ok) {
    error.value = result.error ?? 'No se pudo sincronizar'
    return
  }
  message.value = 'Sincronizado'
  await refreshMatch()
}

async function toggleAutoSync() {
  saving.value = true
  error.value = ''
  const next = !autoSyncEnabled.value
  const { error: err } = await supabase
    .from('matches')
    .update({ auto_sync_enabled: next })
    .eq('id', props.match.id)
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  autoSyncEnabled.value = next
  message.value = next ? 'Sync automático activado' : 'Sync automático pausado'
  await refreshMatch()
}

async function refreshMatch() {
  await matchStore.fetchMatches()
  await loadEvents()
  const updated = matchStore.matches.find((m) => m.id === props.match.id)
  if (updated) syncForm(updated)
}

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
    await refreshMatch()
  }
}

async function revertToScheduled() {
  if (
    !confirm(
      '¿Deshacer el inicio? El partido volverá a programado, se borrarán los goles y se reabrirán las predicciones.',
    )
  ) {
    return
  }
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'scheduled' })
    .eq('id', props.match.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Inicio deshecho — predicciones reabiertas'
    await refreshMatch()
  }
}

async function reopenMatch() {
  if (
    !confirm(
      '¿Reactivar el partido? Volverá a programado, se anulará la puntuación y se borrarán goles y marcador.',
    )
  ) {
    return
  }
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'scheduled' })
    .eq('id', props.match.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Partido reactivado — quedó como programado'
    await refreshMatch()
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
    await refreshMatch()
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
    extra_time: goalExtraTime.value,
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
  await refreshMatch()
}

function startEditGoal(event: MatchEvent) {
  editingEventId.value = event.id
  editMinute.value = event.minute
  editSecond.value = event.event_second ?? 0
  editExtraTime.value = event.extra_time ?? 0
  editTeamId.value = event.team_id ?? props.match.home_team_id
}

function cancelEditGoal() {
  editingEventId.value = null
}

async function saveEditGoal() {
  if (!editingEventId.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('match_events')
    .update({
      minute: editMinute.value,
      extra_time: editExtraTime.value,
      event_second: editSecond.value,
      team_id: editTeamId.value,
    })
    .eq('id', editingEventId.value)
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = 'Gol actualizado'
  editingEventId.value = null
  await refreshMatch()
}

async function deleteGoal(event: MatchEvent) {
  if (!confirm(`¿Eliminar gol al ${formatGoalTime(event.minute, event.event_second ?? 0, event.extra_time ?? 0)}?`)) {
    return
  }
  saving.value = true
  error.value = ''
  const { error: err } = await supabase.from('match_events').delete().eq('id', event.id)
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = 'Gol eliminado'
  await refreshMatch()
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
    await refreshMatch()
  }
}
</script>

<template>
  <div class="space-y-4">
    <section
      class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-4 md:rounded-lg"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-mundial-green">Sync automático en vivo</h3>
          <p class="mt-1 text-xs text-slate-400">
            Se actualiza cada 60 s mientras alguien tenga la app abierta (sin cron de pago).
            También puedes forzar sync o usar controles manuales abajo.
          </p>
          <p class="mt-2 text-xs text-slate-500">
            Última sync: {{ formatSyncTime(match.live_sync_at) }}
          </p>
          <p v-if="match.live_sync_error" class="mt-1 text-xs text-amber-300">
            Aviso: {{ match.live_sync_error }}
          </p>
        </div>
        <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium disabled:opacity-50"
            :disabled="saving"
            @click="syncNow"
          >
            Sync ahora
          </button>
          <button
            type="button"
            class="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium disabled:opacity-50"
            :disabled="saving"
            @click="toggleAutoSync"
          >
            {{ isAutoSyncOn ? 'Pausar sync' : 'Activar sync' }}
          </button>
        </div>
      </div>
    </section>

    <button
      v-if="match.status === 'scheduled' && !isAutoSyncOn"
      type="button"
      :class="[btnPrimary, 'bg-mundial-green']"
      :disabled="saving"
      @click="startLive"
    >
      Iniciar partido manualmente
    </button>

    <p
      v-else-if="match.status === 'scheduled' && isAutoSyncOn"
      class="text-center text-xs text-slate-500"
    >
      El partido pasará a en vivo automáticamente al arrancar.
    </p>

    <template v-if="isFinished">
      <p class="text-center text-sm text-slate-500">
        Partido cerrado. Reactívalo para dejarlo como programado y reabrir predicciones.
      </p>
      <button
        type="button"
        :class="[btnPrimary, 'border border-amber-500/40 bg-amber-500/10 text-amber-200']"
        :disabled="saving"
        @click="reopenMatch"
      >
        Reactivar partido
      </button>
    </template>

    <section
      v-if="sortedEvents.length"
      class="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3"
    >
      <h3 class="text-sm font-semibold">Goles registrados</h3>
      <ul class="space-y-2">
        <li
          v-for="event in sortedEvents"
          :key="event.id"
          class="rounded-lg border border-white/5 bg-white/5 p-2"
        >
          <template v-if="editingEventId === event.id && canManage">
            <div :class="formGrid">
              <label class="block text-sm md:text-xs">
                Equipo
                <select v-model="editTeamId" :class="inputClass">
                  <option :value="match.home_team_id">{{ teamDisplayName(match.home_team, 'Local') }}</option>
                  <option :value="match.away_team_id">{{ teamDisplayName(match.away_team, 'Visita') }}</option>
                </select>
              </label>
              <label class="block text-sm md:text-xs">
                Minuto
                <input
                  v-model.number="editMinute"
                  type="number"
                  min="1"
                  max="120"
                  :class="inputClass"
                />
              </label>
              <label class="block text-sm md:text-xs">
                Segundos
                <input
                  v-model.number="editSecond"
                  type="number"
                  min="0"
                  max="59"
                  :class="inputClass"
                />
              </label>
            </div>
            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-xl bg-mundial-accent py-3 text-sm font-semibold disabled:opacity-50 md:rounded-lg md:py-1.5 md:text-xs"
                :disabled="saving"
                @click="saveEditGoal"
              >
                Guardar
              </button>
              <button
                type="button"
                class="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-400 md:rounded-lg md:py-1.5 md:text-xs"
                :disabled="saving"
                @click="cancelEditGoal"
              >
                Cancelar
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm text-slate-200">
                {{ teamLabel(event.team_id) }} —
                {{ formatGoalTime(event.minute, event.event_second ?? 0, event.extra_time ?? 0) }}
              </span>
              <div v-if="canManage" class="flex shrink-0 gap-1">
                <button
                  type="button"
                  class="rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/10 md:px-2 md:py-1 md:text-[11px]"
                  :disabled="saving"
                  @click="startEditGoal(event)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 md:px-2 md:py-1 md:text-[11px]"
                  :disabled="saving"
                  @click="deleteGoal(event)"
                >
                  Borrar
                </button>
              </div>
            </div>
          </template>
        </li>
      </ul>
    </section>

    <template v-if="canManage">
      <button
        type="button"
        :class="[btnSecondary, 'border border-white/20 text-slate-300']"
        :disabled="saving"
        @click="showManualControls = !showManualControls"
      >
        {{ showManualControls ? 'Ocultar controles manuales' : 'Controles manuales (override)' }}
      </button>

      <template v-if="showManualControls">
      <button
        type="button"
        :class="[btnSecondary, 'border border-red-500/30 bg-red-500/10 text-red-300']"
        :disabled="saving"
        @click="revertToScheduled"
      >
        Deshacer inicio (volver a programado)
      </button>

      <section class="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 md:rounded-lg md:p-3">
        <h3 class="text-sm font-semibold">Marcador y minuto</h3>
        <div :class="formGrid">
          <label class="block text-sm md:text-xs">
            Min
            <input
              v-model.number="currentMinute"
              type="number"
              min="0"
              max="120"
              :class="inputClass"
            />
          </label>
          <label class="block text-sm md:text-xs">
            Local
            <input
              v-model.number="homeScore"
              type="number"
              min="0"
              :class="inputClass"
            />
          </label>
          <label class="block text-sm md:text-xs">
            Visita
            <input
              v-model.number="awayScore"
              type="number"
              min="0"
              :class="inputClass"
            />
          </label>
        </div>
        <p class="text-xs text-slate-500">
          Si registras o editas goles, el marcador se sincroniza solo. Puedes ajustarlo manualmente si hace falta.
        </p>
        <button
          type="button"
          :class="[btnSecondary, 'bg-slate-600 font-semibold text-white']"
          :disabled="saving"
          @click="updateLiveState"
        >
          Actualizar marcador
        </button>
      </section>

      <section class="space-y-3 rounded-xl border border-mundial-accent/30 bg-mundial-accent/5 p-4 md:rounded-lg md:p-3">
        <h3 class="text-sm font-semibold text-mundial-accent">Registrar gol</h3>
        <div :class="formGrid">
          <label class="block text-sm md:text-xs">
            Equipo
            <select v-model="goalTeamId" :class="inputClass">
              <option :value="match.home_team_id">{{ teamDisplayName(match.home_team, 'Local') }}</option>
              <option :value="match.away_team_id">{{ teamDisplayName(match.away_team, 'Visita') }}</option>
            </select>
          </label>
          <label class="block text-sm md:text-xs">
            Minuto
            <input
              v-model.number="goalMinute"
              type="number"
              min="1"
              max="120"
              :class="inputClass"
            />
          </label>
          <label class="block text-sm md:text-xs">
            Segundos
            <input
              v-model.number="goalSecond"
              type="number"
              min="0"
              max="59"
              :class="inputClass"
            />
          </label>
          <label class="block text-sm md:text-xs">
            Agregado
            <input
              v-model.number="goalExtraTime"
              type="number"
              min="0"
              max="15"
              :class="inputClass"
            />
          </label>
        </div>
        <p class="text-xs text-slate-500">
          Desde el segundo 30 cuenta como el siguiente minuto para puntuar (ej. 34:45 → casillero 35).
          Usa agregado para goles tipo 90+2.
        </p>
        <button
          type="button"
          :class="[btnPrimary, 'bg-mundial-accent']"
          :disabled="saving"
          @click="registerGoal"
        >
          Registrar gol
        </button>
      </section>

      <button
        type="button"
        :class="[
          btnPrimary,
          'border-2 border-white/30 bg-white/5 text-slate-200 hover:bg-white/10',
        ]"
        :disabled="saving"
        @click="finishMatch"
      >
        Finalizar partido
      </button>
      </template>
    </template>

    <p v-if="message" class="text-xs text-mundial-green">{{ message }}</p>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>
