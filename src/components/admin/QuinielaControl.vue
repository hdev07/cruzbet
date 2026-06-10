<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMatchStore } from '@/stores/matchStore'
import type { Match, MatchStatus } from '@/types'

const matchStore = useMatchStore()

const search = ref('')
const statusFilter = ref<'all' | MatchStatus>('all')
const selectedMatchId = ref('')
const currentMinute = ref(0)
const homeScore = ref(0)
const awayScore = ref(0)
const goalTeamId = ref('')
const goalMinute = ref(1)
const saving = ref(false)
const message = ref('')
const error = ref('')

const phaseLabels: Record<string, string> = {
  group: 'Grupos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  final: 'Final',
}

const filteredMatches = computed(() => {
  const q = search.value.trim().toLowerCase()
  return matchStore.matches.filter((m) => {
    if (statusFilter.value !== 'all' && m.status !== statusFilter.value) return false
    if (!q) return true
    const home = m.home_team?.name?.toLowerCase() ?? ''
    const away = m.away_team?.name?.toLowerCase() ?? ''
    const venue = m.venue?.toLowerCase() ?? ''
    return home.includes(q) || away.includes(q) || venue.includes(q)
  })
})

const selectedMatch = computed(() =>
  matchStore.matches.find((m) => m.id === selectedMatchId.value),
)

const liveCount = computed(() => matchStore.matches.filter((m) => m.status === 'live').length)
const scheduledCount = computed(() => matchStore.matches.filter((m) => m.status === 'scheduled').length)

function matchLabel(match: Match) {
  const phase = phaseLabels[match.phase ?? ''] ?? match.phase
  const date = match.match_date
    ? new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : ''
  const status =
    match.status === 'live'
      ? `${match.current_minute ?? 0}' EN VIVO`
      : match.status === 'finished'
        ? 'Finalizado'
        : 'Programado'
  return `${match.home_team?.name} vs ${match.away_team?.name} · ${phase} · ${status}${date ? ` · ${date}` : ''}`
}

function syncForm(match: Match) {
  currentMinute.value = match.current_minute ?? 0
  homeScore.value = match.home_score
  awayScore.value = match.away_score
  goalMinute.value = Math.max((match.current_minute ?? 0) + 1, 1)
  goalTeamId.value = match.home_team_id
}

watch(selectedMatch, (match) => {
  if (match) syncForm(match)
})

async function startLive() {
  if (!selectedMatch.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'live', current_minute: 0, home_score: 0, away_score: 0 })
    .eq('id', selectedMatch.value.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Partido iniciado — predicciones cerradas para usuarios'
    await matchStore.fetchMatches()
    syncForm(matchStore.matches.find((m) => m.id === selectedMatchId.value)!)
  }
}

async function updateLiveState() {
  if (!selectedMatch.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({
      current_minute: currentMinute.value,
      home_score: homeScore.value,
      away_score: awayScore.value,
    })
    .eq('id', selectedMatch.value.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Marcador y minuto actualizados'
    await matchStore.fetchMatches()
  }
}

async function registerGoal() {
  if (!selectedMatch.value || !goalTeamId.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase.from('match_events').insert({
    match_id: selectedMatch.value.id,
    team_id: goalTeamId.value,
    event_type: 'goal',
    minute: goalMinute.value,
    extra_time: 0,
    metadata: { type: 'foot' },
  })
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = `Gol al ${goalMinute.value}' registrado`
  await matchStore.fetchMatches()
  if (selectedMatch.value) syncForm(selectedMatch.value)
}

async function finishMatch() {
  if (!selectedMatch.value) return
  saving.value = true
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ status: 'finished' })
    .eq('id', selectedMatch.value.id)
  saving.value = false
  if (err) error.value = err.message
  else {
    message.value = 'Partido finalizado — puntos repartidos a la quiniela'
    await matchStore.fetchMatches()
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
      <p>
        <strong class="text-slate-200">{{ matchStore.matches.length }} partidos</strong> del seed
        · {{ liveCount }} en vivo · {{ scheduledCount }} programados
      </p>
      <p class="mt-1">
        Usuarios predicen antes del kickoff. Tú inicias el partido, registras goles y al finalizar se reparten puntos.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in ([['all', 'Todos'], ['scheduled', 'Programados'], ['live', 'En vivo'], ['finished', 'Finalizados']] as const)"
        :key="f[0]"
        class="rounded-lg px-3 py-1.5 text-xs"
        :class="statusFilter === f[0] ? 'bg-mundial-accent' : 'bg-white/10'"
        @click="statusFilter = f[0]"
      >
        {{ f[1] }}
      </button>
    </div>

    <input
      v-model="search"
      type="search"
      placeholder="Buscar equipo o estadio..."
      class="w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2 text-sm"
    />

    <label class="block text-sm">
      Partido del Mundial
      <select
        v-model="selectedMatchId"
        class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2"
      >
        <option value="">Seleccionar partido ({{ filteredMatches.length }})</option>
        <option v-for="match in filteredMatches" :key="match.id" :value="match.id">
          {{ matchLabel(match) }}
        </option>
      </select>
    </label>

    <template v-if="selectedMatch">
      <header class="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
        <p class="mb-1 text-xs text-slate-400">
          {{ phaseLabels[selectedMatch.phase ?? ''] ?? selectedMatch.phase }}
          <span v-if="selectedMatch.venue"> · {{ selectedMatch.venue }}</span>
        </p>
        <div class="flex items-center justify-center gap-3">
          <span class="font-bold">{{ selectedMatch.home_team?.name }}</span>
          <span class="text-2xl font-bold tabular-nums text-mundial-accent">
            {{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}
          </span>
          <span class="font-bold">{{ selectedMatch.away_team?.name }}</span>
        </div>
        <p class="mt-2 text-sm">
          <span
            v-if="selectedMatch.status === 'live'"
            class="rounded-full bg-mundial-green px-2 py-0.5 text-xs font-semibold"
          >
            EN VIVO · {{ selectedMatch.current_minute ?? 0 }}'
          </span>
          <span v-else-if="selectedMatch.status === 'finished'" class="text-slate-400">Finalizado</span>
          <span v-else class="text-slate-400">Programado</span>
        </p>
      </header>

      <button
        v-if="selectedMatch.status === 'scheduled'"
        class="w-full rounded-lg bg-mundial-green py-3 font-semibold disabled:opacity-50"
        :disabled="saving"
        @click="startLive"
      >
        Iniciar partido en vivo
      </button>

      <template v-if="selectedMatch.status === 'live'">
        <section class="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="font-semibold">Marcador y minuto</h3>
          <div class="grid grid-cols-3 gap-3">
            <label class="block text-sm">
              Minuto
              <input v-model.number="currentMinute" type="number" min="0" max="120" class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2" />
            </label>
            <label class="block text-sm">
              Local
              <input v-model.number="homeScore" type="number" min="0" class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2" />
            </label>
            <label class="block text-sm">
              Visitante
              <input v-model.number="awayScore" type="number" min="0" class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2" />
            </label>
          </div>
          <button
            class="w-full rounded-lg bg-slate-600 py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="saving"
            @click="updateLiveState"
          >
            Actualizar
          </button>
        </section>

        <section class="space-y-4 rounded-xl border border-mundial-accent/30 bg-mundial-accent/5 p-4">
          <h3 class="font-semibold text-mundial-accent">Registrar gol</h3>
          <p class="text-xs text-slate-400">Registra todos los goles antes de finalizar el partido.</p>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm">
              Equipo
              <select v-model="goalTeamId" class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2">
                <option :value="selectedMatch.home_team_id">{{ selectedMatch.home_team?.name }}</option>
                <option :value="selectedMatch.away_team_id">{{ selectedMatch.away_team?.name }}</option>
              </select>
            </label>
            <label class="block text-sm">
              Minuto
              <input v-model.number="goalMinute" type="number" min="1" max="120" class="mt-1 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2" />
            </label>
          </div>
          <button
            class="w-full rounded-lg bg-mundial-accent py-2.5 font-semibold disabled:opacity-50"
            :disabled="saving"
            @click="registerGoal"
          >
            Registrar gol
          </button>
        </section>

        <button
          class="w-full rounded-lg border border-white/20 py-2 text-sm text-slate-400 hover:bg-white/5"
          :disabled="saving"
          @click="finishMatch"
        >
          Finalizar partido
        </button>
      </template>

      <p v-if="selectedMatch.status === 'finished'" class="text-center text-sm text-slate-400">
        Partido cerrado. Los usuarios ya no pueden predecir.
      </p>
    </template>

    <p v-if="message" class="text-sm text-mundial-green">{{ message }}</p>
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
  </div>
</template>
