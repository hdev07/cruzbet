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
  props.mobile ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4' : 'grid grid-cols-2 gap-2 lg:grid-cols-4',
)
const inputClass =
  'mt-1.5 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2.5 text-base md:py-1.5 md:text-sm'

const isScheduled = computed(() => props.match.status === 'scheduled')
const isLive = computed(() => props.match.status === 'live')
const isFinished = computed(() => props.match.status === 'finished')
const isAutoSyncOn = computed(() => autoSyncEnabled.value !== false)
const canEditGoals = computed(() => isLive.value || isFinished.value)

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

function formatSyncTime(iso: string | null | undefined) {
  if (!iso) return 'Aún no'
  return new Date(iso).toLocaleString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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

async function refreshMatch() {
  await matchStore.fetchMatches()
  await loadEvents()
  const updated = matchStore.matches.find((m) => m.id === props.match.id)
  if (updated) syncForm(updated)
}

async function syncNow() {
  saving.value = true
  error.value = ''
  message.value = ''
  const result = await triggerLiveSync()
  saving.value = false
  if (!result.ok) {
    error.value = result.error ?? 'No se pudo sincronizar'
    return
  }
  message.value = 'Partido sincronizado'
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
  message.value = next ? 'Auto sync activado para este partido' : 'Auto sync pausado'
  await refreshMatch()
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
    message.value = 'Partido iniciado manualmente'
    await refreshMatch()
  }
}

async function revertToScheduled() {
  if (
    !confirm(
      '¿Volver a programado? Se borran goles, se resetea marcador y se reabren predicciones.',
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
    message.value = 'Partido en programado'
    await refreshMatch()
  }
}

async function reopenMatch() {
  if (
    !confirm(
      '¿Reactivar? Vuelve a programado, anula puntos y borra goles/marcador.',
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
    message.value = 'Partido reactivado'
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
    message.value = 'Marcador y minuto guardados'
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
    metadata: { type: 'foot', source: 'manual' },
  })
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = `Gol registrado (${formatGoalTime(goalMinute.value, goalSecond.value, goalExtraTime.value)})`
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
  if (!confirm('¿Finalizar partido y calcular puntos?')) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', props.match.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Partido finalizado'
    await refreshMatch()
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- 1. SYNC -->
    <section class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-4">
      <h3 class="text-sm font-semibold text-mundial-green">1. Sync automático</h3>
      <p class="mt-1 text-xs text-slate-400">
        cron-job.org + sync manual. Si falla, usa las secciones de abajo.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          :class="isAutoSyncOn ? 'bg-mundial-green/25 text-mundial-green' : 'bg-white/10 text-slate-400'"
        >
          {{ isAutoSyncOn ? 'Auto ON' : 'Auto OFF' }}
        </span>
        <span class="text-xs text-slate-500">Última sync: {{ formatSyncTime(match.live_sync_at) }}</span>
      </div>
      <p v-if="match.live_sync_error" class="mt-2 text-xs text-amber-300">{{ match.live_sync_error }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium disabled:opacity-50"
          :disabled="saving"
          @click="syncNow"
        >
          Sync este partido
        </button>
        <button
          type="button"
          class="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium disabled:opacity-50"
          :disabled="saving"
          @click="toggleAutoSync"
        >
          {{ isAutoSyncOn ? 'Pausar auto' : 'Activar auto' }}
        </button>
      </div>
    </section>

    <!-- 2. ESTADO -->
    <section class="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 class="text-sm font-semibold text-slate-100">2. Estado del partido</h3>

      <div v-if="isScheduled" class="mt-3 space-y-2">
        <p class="text-xs text-slate-500">
          {{ isAutoSyncOn ? 'Pasará a en vivo solo al arrancar el partido real.' : 'Sync pausado: inicia manualmente.' }}
        </p>
        <button
          v-if="!isAutoSyncOn"
          type="button"
          :class="[btnPrimary, 'bg-mundial-green']"
          :disabled="saving"
          @click="startLive"
        >
          Iniciar partido manualmente
        </button>
      </div>

      <div v-else-if="isFinished" class="mt-3 space-y-2">
        <p class="text-xs text-slate-500">Partido cerrado. Puedes editar goles abajo o reactivar.</p>
        <button
          type="button"
          :class="[btnSecondary, 'border border-amber-500/40 text-amber-200']"
          :disabled="saving"
          @click="reopenMatch"
        >
          Reactivar partido
        </button>
      </div>

      <div v-if="isLive || isFinished" class="mt-4 space-y-3">
        <div class="grid grid-cols-3 gap-2">
          <label class="block text-xs text-slate-400">
            Minuto
            <input v-model.number="currentMinute" type="number" min="0" max="120" :class="inputClass" />
          </label>
          <label class="block text-xs text-slate-400">
            Local
            <input v-model.number="homeScore" type="number" min="0" :class="inputClass" />
          </label>
          <label class="block text-xs text-slate-400">
            Visita
            <input v-model.number="awayScore" type="number" min="0" :class="inputClass" />
          </label>
        </div>
        <button
          type="button"
          :class="[btnSecondary, 'bg-slate-600 font-semibold text-white']"
          :disabled="saving"
          @click="updateLiveState"
        >
          Guardar marcador y minuto
        </button>
      </div>

      <div v-if="isLive" class="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          :class="[btnPrimary, 'border border-white/20 bg-white/5 text-slate-200']"
          :disabled="saving"
          @click="finishMatch"
        >
          Finalizar partido
        </button>
        <button
          type="button"
          :class="[btnSecondary, 'border border-red-500/30 text-red-300']"
          :disabled="saving"
          @click="revertToScheduled"
        >
          Volver a programado
        </button>
      </div>
    </section>

    <!-- 3. GOLES -->
    <section class="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 class="text-sm font-semibold text-slate-100">3. Goles</h3>

      <ul v-if="sortedEvents.length" class="mt-3 space-y-2">
        <li
          v-for="event in sortedEvents"
          :key="event.id"
          class="rounded-lg border border-white/5 bg-white/5 p-3"
        >
          <template v-if="editingEventId === event.id">
            <div :class="formGrid">
              <label class="block text-xs">
                Equipo
                <select v-model="editTeamId" :class="inputClass">
                  <option :value="match.home_team_id">{{ teamDisplayName(match.home_team, 'Local') }}</option>
                  <option :value="match.away_team_id">{{ teamDisplayName(match.away_team, 'Visita') }}</option>
                </select>
              </label>
              <label class="block text-xs">
                Minuto
                <input v-model.number="editMinute" type="number" min="1" max="120" :class="inputClass" />
              </label>
              <label class="block text-xs">
                Agregado
                <input v-model.number="editExtraTime" type="number" min="0" max="15" :class="inputClass" />
              </label>
              <label class="block text-xs">
                Segundos
                <input v-model.number="editSecond" type="number" min="0" max="59" :class="inputClass" />
              </label>
            </div>
            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-lg bg-mundial-accent py-2 text-xs font-semibold"
                :disabled="saving"
                @click="saveEditGoal"
              >
                Guardar
              </button>
              <button type="button" class="rounded-lg border border-white/20 px-4 py-2 text-xs" @click="cancelEditGoal">
                Cancelar
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm text-slate-200">
                {{ teamLabel(event.team_id) }} —
                {{ formatGoalTime(event.minute, event.event_second ?? 0, event.extra_time ?? 0) }}
                <span
                  v-if="(event.metadata as Record<string, unknown>)?.source === 'live_sync' || (event.metadata as Record<string, unknown>)?.sync_key"
                  class="ml-1 text-[10px] text-slate-500"
                >(auto)</span>
              </span>
              <div v-if="canEditGoals" class="flex gap-1">
                <button type="button" class="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/10" @click="startEditGoal(event)">
                  Editar
                </button>
                <button type="button" class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10" @click="deleteGoal(event)">
                  Borrar
                </button>
              </div>
            </div>
          </template>
        </li>
      </ul>
      <p v-else class="mt-3 text-xs text-slate-500">Sin goles registrados.</p>

      <div v-if="canEditGoals" class="mt-4 space-y-3 border-t border-white/10 pt-4">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-mundial-accent">Registrar gol manual</h4>
        <div :class="formGrid">
          <label class="block text-xs">
            Equipo
            <select v-model="goalTeamId" :class="inputClass">
              <option :value="match.home_team_id">{{ teamDisplayName(match.home_team, 'Local') }}</option>
              <option :value="match.away_team_id">{{ teamDisplayName(match.away_team, 'Visita') }}</option>
            </select>
          </label>
          <label class="block text-xs">
            Minuto
            <input v-model.number="goalMinute" type="number" min="1" max="120" :class="inputClass" />
          </label>
          <label class="block text-xs">
            Agregado
            <input v-model.number="goalExtraTime" type="number" min="0" max="15" :class="inputClass" />
          </label>
          <label class="block text-xs">
            Segundos
            <input v-model.number="goalSecond" type="number" min="0" max="59" :class="inputClass" />
          </label>
        </div>
        <p class="text-[11px] text-slate-500">
          Segundo ≥30 cuenta como minuto siguiente. Agregado: 90+2 → minuto 90, agregado 2.
        </p>
        <button type="button" :class="[btnPrimary, 'bg-mundial-accent']" :disabled="saving" @click="registerGoal">
          Registrar gol
        </button>
      </div>
      <p v-else class="mt-3 text-xs text-slate-500">Inicia el partido para registrar goles.</p>
    </section>

    <p v-if="message" class="text-xs text-mundial-green">{{ message }}</p>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>
