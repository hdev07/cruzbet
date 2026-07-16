<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import { supabase } from '@/lib/supabase'
import { teamDisplayName } from '@/lib/teamDisplay'
import { triggerLiveSync } from '@/lib/liveSync'
import { useMatchStore } from '@/stores/matchStore'
import type { Match, MatchEvent } from '@/types'

type CardType = 'yellow' | 'red' | 'second_yellow'
type PendingConfirm = 'revertToScheduled' | 'reopenMatch' | 'finishMatch' | 'deleteEvent'

const MANAGEABLE_EVENT_TYPES = new Set(['goal', 'card'])

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
const cardTeamId = ref('')
const cardMinute = ref(1)
const cardSecond = ref(0)
const cardExtraTime = ref(0)
const cardType = ref<CardType>('yellow')
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
const pendingConfirm = ref<PendingConfirm | null>(null)
const pendingDeleteEvent = ref<MatchEvent | null>(null)

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
const canManageEvents = computed(() => isLive.value || isFinished.value)

const sortedManageableEvents = computed(() =>
  [...events.value]
    .filter((e) => MANAGEABLE_EVENT_TYPES.has(e.event_type))
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

function formatEventTime(minute: number, second: number, extraTime = 0) {
  if (extraTime > 0) {
    const suffix = second > 0 ? `:${String(second).padStart(2, '0')}` : ''
    return `${minute}+${extraTime}${suffix}'`
  }
  if (second > 0) return `${minute}:${String(second).padStart(2, '0')}`
  return `${minute}'`
}

function cardTypeLabel(type: unknown): string {
  if (type === 'red') return 'Tarjeta roja'
  if (type === 'second_yellow') return 'Segunda amarilla'
  return 'Tarjeta amarilla'
}

function eventTypeLabel(event: MatchEvent): string {
  if (event.event_type === 'goal') return 'Gol'
  if (event.event_type === 'card') return cardTypeLabel(event.metadata?.card_type)
  return event.event_type
}

function eventSourceBadge(event: MatchEvent): string | null {
  const src = event.source ?? (event.metadata?.source as string | undefined)
  if (!src) return null
  if (src === 'live_sync') return 'auto'
  return src
}

function eventSourceBadgeClass(badge: string): string {
  if (badge === 'manual') return 'bg-white/10 text-slate-400'
  if (badge === 'espn') return 'bg-blue-500/15 text-blue-300'
  return 'bg-white/5 text-slate-500'
}

function cardTypeBadgeClass(type: unknown): string {
  if (type === 'red') return 'bg-red-500/20 text-red-300'
  if (type === 'second_yellow') return 'bg-amber-500/20 text-amber-300'
  return 'bg-yellow-500/20 text-yellow-200'
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
  const nextMinute = Math.max((match.current_minute ?? 0) + 1, 1)
  goalMinute.value = nextMinute
  goalSecond.value = 0
  goalExtraTime.value = 0
  goalTeamId.value = match.home_team_id ?? ''
  cardMinute.value = nextMinute
  cardSecond.value = 0
  cardExtraTime.value = 0
  cardTeamId.value = match.home_team_id ?? ''
  cardType.value = 'yellow'
  autoSyncEnabled.value = match.auto_sync_enabled !== false
}

async function loadEvents() {
  const { data, error: err } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', props.match.id)
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
  await matchStore.fetchMatches({ force: true })
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

const confirmModalTitle = computed(() => {
  switch (pendingConfirm.value) {
    case 'revertToScheduled':
      return '¿Volver a programado?'
    case 'reopenMatch':
      return '¿Reactivar partido?'
    case 'finishMatch':
      return '¿Finalizar partido?'
    case 'deleteEvent': {
      const event = pendingDeleteEvent.value
      if (!event) return '¿Eliminar evento?'
      const time = formatEventTime(event.minute, event.event_second ?? 0, event.extra_time ?? 0)
      return `¿Eliminar ${eventTypeLabel(event).toLowerCase()} al ${time}?`
    }
    default:
      return ''
  }
})

const confirmModalSubtitle = computed(() => {
  switch (pendingConfirm.value) {
    case 'revertToScheduled':
      return 'Se borran eventos, se resetea marcador y se reabren predicciones.'
    case 'reopenMatch':
      return 'Vuelve a programado, anula puntos y borra eventos/marcador.'
    case 'finishMatch':
      return 'Se calcularán los puntos de las predicciones.'
    case 'deleteEvent':
      if (!pendingDeleteEvent.value) return undefined
      if (pendingDeleteEvent.value.event_type === 'goal') {
        return `${teamLabel(pendingDeleteEvent.value.team_id)} dejará de contar en el marcador.`
      }
      return `${teamLabel(pendingDeleteEvent.value.team_id)} perderá esta tarjeta del registro.`
    default:
      return undefined
  }
})

const confirmModalLabel = computed(() => {
  switch (pendingConfirm.value) {
    case 'revertToScheduled':
      return 'Sí, volver a programado'
    case 'reopenMatch':
      return 'Sí, reactivar'
    case 'finishMatch':
      return 'Sí, finalizar'
    case 'deleteEvent':
      return 'Sí, eliminar'
    default:
      return 'Confirmar'
  }
})

function requestRevertToScheduled() {
  pendingConfirm.value = 'revertToScheduled'
}

function requestReopenMatch() {
  pendingConfirm.value = 'reopenMatch'
}

function requestFinishMatch() {
  pendingConfirm.value = 'finishMatch'
}

function requestDeleteEvent(event: MatchEvent) {
  pendingDeleteEvent.value = event
  pendingConfirm.value = 'deleteEvent'
}

function cancelPendingConfirm() {
  if (saving.value) return
  pendingConfirm.value = null
  pendingDeleteEvent.value = null
}

async function confirmPendingAction() {
  const action = pendingConfirm.value
  if (!action) return

  switch (action) {
    case 'revertToScheduled':
      await revertToScheduled()
      break
    case 'reopenMatch':
      await reopenMatch()
      break
    case 'finishMatch':
      await finishMatch()
      break
    case 'deleteEvent': {
      const deleteEvent = pendingDeleteEvent.value
      if (deleteEvent) await removeEvent(deleteEvent)
      break
    }
  }

  pendingConfirm.value = null
  pendingDeleteEvent.value = null
}

async function revertToScheduled() {
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
    source: 'manual',
    metadata: { type: 'foot', source: 'manual' },
  })
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = `Gol registrado (${formatEventTime(goalMinute.value, goalSecond.value, goalExtraTime.value)})`
  await refreshMatch()
}

async function registerCard() {
  if (!cardTeamId.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase.from('match_events').insert({
    match_id: props.match.id,
    team_id: cardTeamId.value,
    event_type: 'card',
    minute: cardMinute.value,
    extra_time: cardExtraTime.value,
    event_second: cardSecond.value,
    source: 'manual',
    metadata: { card_type: cardType.value, source: 'manual' },
  })
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = `${cardTypeLabel(cardType.value)} registrada (${formatEventTime(cardMinute.value, cardSecond.value, cardExtraTime.value)})`
  await refreshMatch()
}

function startEditGoal(event: MatchEvent) {
  editingEventId.value = event.id
  editMinute.value = event.minute
  editSecond.value = event.event_second ?? 0
  editExtraTime.value = event.extra_time ?? 0
  editTeamId.value = event.team_id ?? props.match.home_team_id ?? ''
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

async function removeEvent(event: MatchEvent) {
  saving.value = true
  error.value = ''
  const { error: err } = await supabase.from('match_events').delete().eq('id', event.id)
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = event.event_type === 'goal' ? 'Gol eliminado' : 'Tarjeta eliminada'
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
    message.value = 'Partido finalizado'
    await refreshMatch()
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 1. SYNC -->
    <section class="theme-card border-mundial-green/30 bg-mundial-green/10 p-4">
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

    <!-- 2. EVENTOS -->
    <section class="theme-card p-4">
      <h3 class="text-sm font-semibold text-slate-100">2. Eventos del partido</h3>
      <p class="mt-1 text-xs text-slate-500">Goles y tarjetas ordenados por minuto.</p>

      <ul v-if="sortedManageableEvents.length" class="mt-3 space-y-2">
        <li
          v-for="event in sortedManageableEvents"
          :key="event.id"
          class="rounded-lg border border-white/5 bg-white/5 p-3"
        >
          <template v-if="event.event_type === 'goal' && editingEventId === event.id">
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
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    :class="
                      event.event_type === 'goal'
                        ? 'bg-mundial-accent/20 text-mundial-accent'
                        : cardTypeBadgeClass(event.metadata?.card_type)
                    "
                  >
                    {{ eventTypeLabel(event) }}
                  </span>
                  <span
                    v-if="eventSourceBadge(event)"
                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="eventSourceBadgeClass(eventSourceBadge(event) ?? '')"
                  >
                    {{ eventSourceBadge(event) }}
                  </span>
                </div>
                <span class="text-sm text-slate-200">
                  {{ teamLabel(event.team_id) }} —
                  {{ formatEventTime(event.minute, event.event_second ?? 0, event.extra_time ?? 0) }}
                </span>
              </div>

              <div v-if="canManageEvents" class="flex shrink-0 gap-1">
                <button
                  v-if="event.event_type === 'goal'"
                  type="button"
                  class="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/10"
                  @click="startEditGoal(event)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  @click="requestDeleteEvent(event)"
                >
                  Borrar
                </button>
              </div>
            </div>
          </template>
        </li>
      </ul>
      <p v-else class="mt-3 text-xs text-slate-500">Sin goles ni tarjetas registrados.</p>
    </section>

    <!-- 3. GOLES -->
    <section class="theme-card p-4">
      <h3 class="text-sm font-semibold text-slate-100">3. Registrar gol manual</h3>

      <div v-if="canManageEvents" class="mt-4 space-y-3">
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

    <!-- 4. TARJETAS -->
    <section class="theme-card p-4">
      <h3 class="text-sm font-semibold text-slate-100">4. Registrar tarjeta manual</h3>

      <div v-if="canManageEvents" class="mt-4 space-y-3">
        <div :class="formGrid">
          <label class="block text-xs">
            Equipo
            <select v-model="cardTeamId" :class="inputClass">
              <option :value="match.home_team_id">{{ teamDisplayName(match.home_team, 'Local') }}</option>
              <option :value="match.away_team_id">{{ teamDisplayName(match.away_team, 'Visita') }}</option>
            </select>
          </label>
          <label class="block text-xs">
            Tipo
            <select v-model="cardType" :class="inputClass">
              <option value="yellow">Amarilla</option>
              <option value="second_yellow">Segunda amarilla</option>
              <option value="red">Roja</option>
            </select>
          </label>
          <label class="block text-xs">
            Minuto
            <input v-model.number="cardMinute" type="number" min="1" max="120" :class="inputClass" />
          </label>
          <label class="block text-xs">
            Agregado
            <input v-model.number="cardExtraTime" type="number" min="0" max="15" :class="inputClass" />
          </label>
          <label class="block text-xs">
            Segundos
            <input v-model.number="cardSecond" type="number" min="0" max="59" :class="inputClass" />
          </label>
        </div>
        <button type="button" :class="[btnPrimary, 'bg-amber-600']" :disabled="saving" @click="registerCard">
          Registrar tarjeta
        </button>
      </div>
      <p v-else class="mt-3 text-xs text-slate-500">Inicia el partido para registrar tarjetas.</p>
    </section>

    <!-- 5. ESTADO MANUAL (colapsable) -->
    <details class="group rounded-xl border border-white/10 bg-black/10">
      <summary class="cursor-pointer list-none rounded-xl p-4 marker:content-none">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-semibold text-slate-300">5. Estado manual del partido</h3>
            <p class="mt-1 text-xs text-slate-500">
              Solo si el sync automático no cubre el caso. Estado actual:
              <span class="font-medium text-slate-300">{{ match.status }}</span>
            </p>
          </div>
          <span class="text-xs text-slate-500 transition group-open:rotate-180">▼</span>
        </div>
      </summary>

      <div class="space-y-4 border-t border-white/10 px-4 pb-4 pt-3">
        <div v-if="isScheduled" class="space-y-2">
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

        <div v-else-if="isFinished" class="space-y-2">
          <p class="text-xs text-slate-500">Partido cerrado. Puedes editar eventos arriba o reactivar.</p>
          <button
            type="button"
            :class="[btnSecondary, 'border border-amber-500/40 text-amber-200']"
            :disabled="saving"
            @click="requestReopenMatch"
          >
            Reactivar partido
          </button>
        </div>

        <div v-if="isLive || isFinished" class="space-y-3">
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

        <div v-if="isLive" class="flex flex-wrap gap-2">
          <button
            type="button"
            :class="[btnPrimary, 'border border-white/20 bg-white/5 text-slate-200']"
            :disabled="saving"
            @click="requestFinishMatch"
          >
            Finalizar partido
          </button>
          <button
            type="button"
            :class="[btnSecondary, 'border border-red-500/30 text-red-300']"
            :disabled="saving"
            @click="requestRevertToScheduled"
          >
            Volver a programado
          </button>
        </div>
      </div>
    </details>

    <p v-if="message" class="text-xs text-mundial-green">{{ message }}</p>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>

    <ConfirmModal
      :open="pendingConfirm != null"
      :title="confirmModalTitle"
      :subtitle="confirmModalSubtitle"
      :confirm-label="confirmModalLabel"
      cancel-label="Cancelar"
      :saving="saving"
      @confirm="confirmPendingAction"
      @cancel="cancelPendingConfirm"
    />
  </div>
</template>

<style scoped>
details > summary::-webkit-details-marker {
  display: none;
}
</style>
