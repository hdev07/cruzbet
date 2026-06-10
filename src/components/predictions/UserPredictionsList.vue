<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Clock, Target, X } from '@lucide/vue'
import SearchSelect from '@/components/shared/SearchSelect.vue'
import {
  getPredictionStatus,
  predictionSummary,
  statusBadgeClass,
} from '@/lib/predictionDisplay'
import type { PredictionWithMatch } from '@/types'

const props = withDefaults(
  defineProps<{
    predictions: PredictionWithMatch[]
    loading?: boolean
    emptyMessage?: string
    title?: string
    showMatchLink?: boolean
    showFilters?: boolean
  }>(),
  {
    loading: false,
    emptyMessage: 'Aún no tienes predicciones',
    title: 'Mis predicciones',
    showMatchLink: true,
    showFilters: true,
  },
)

const selectedGroup = ref('')
const selectedTeamId = ref<string | ''>('')

const groupOptions = computed(() => {
  const groups = new Set<string>()
  for (const entry of props.predictions) {
    const match = entry.match
    if (!match) continue
    if (match.home_team?.group_name) groups.add(match.home_team.group_name)
    if (match.away_team?.group_name) groups.add(match.away_team.group_name)
  }
  return [...groups].sort()
})

const teamOptions = computed(() => {
  const teams = new Map<string, { name: string; flag_url: string | null }>()
  for (const entry of props.predictions) {
    const match = entry.match
    if (!match) continue

    if (selectedGroup.value) {
      const inGroup =
        match.home_team?.group_name === selectedGroup.value ||
        match.away_team?.group_name === selectedGroup.value
      if (!inGroup) continue
    }

    if (match.home_team) {
      teams.set(match.home_team_id, {
        name: match.home_team.name,
        flag_url: match.home_team.flag_url,
      })
    }
    if (match.away_team) {
      teams.set(match.away_team_id, {
        name: match.away_team.name,
        flag_url: match.away_team.flag_url,
      })
    }
  }
  return [...teams.entries()]
    .sort((a, b) => a[1].name.localeCompare(b[1].name, 'es'))
    .map(([id, team]) => ({
      value: id,
      label: team.name,
      image: team.flag_url ?? undefined,
      imageAlt: team.name,
    }))
})

const filteredPredictions = computed(() =>
  props.predictions.filter((entry) => {
    const match = entry.match
    if (selectedGroup.value) {
      if (!match) return false
      const inGroup =
        match.home_team?.group_name === selectedGroup.value ||
        match.away_team?.group_name === selectedGroup.value
      if (!inGroup) return false
    }
    if (selectedTeamId.value) {
      if (!match) return false
      const involvesTeam =
        match.home_team_id === selectedTeamId.value ||
        match.away_team_id === selectedTeamId.value
      if (!involvesTeam) return false
    }
    return true
  }),
)

const hasActiveFilters = computed(() => !!selectedGroup.value || !!selectedTeamId.value)

const showFiltersBar = computed(
  () => props.showFilters && !props.loading && props.predictions.length > 0,
)

const items = computed(() =>
  filteredPredictions.value.map((entry) => ({
    entry,
    summary: predictionSummary(entry, entry.match),
    status: getPredictionStatus(entry, entry.match),
  })),
)

function clearFilters() {
  selectedGroup.value = ''
  selectedTeamId.value = ''
}

watch(selectedGroup, () => {
  if (
    selectedTeamId.value &&
    !teamOptions.value.some((option) => option.value === selectedTeamId.value)
  ) {
    selectedTeamId.value = ''
  }
})

function matchLabel(entry: PredictionWithMatch) {
  const m = entry.match
  if (!m) return 'Partido'
  return `${m.home_team?.name ?? 'Local'} vs ${m.away_team?.name ?? 'Visitante'}`
}

function matchScore(entry: PredictionWithMatch) {
  const m = entry.match
  if (!m || m.status === 'scheduled') return null
  return `${m.home_score} - ${m.away_score}`
}
</script>

<template>
  <section>
    <h2 v-if="title" class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
      {{ title }}
    </h2>

    <div
      v-if="showFiltersBar"
      class="mb-4 rounded-xl border border-white/10 bg-white/5 p-4"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Filtrar predicciones
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex items-center gap-1 text-xs text-mundial-accent hover:underline"
          @click="clearFilters"
        >
          <X class="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="mb-1 block text-xs text-slate-400">Grupo</span>
          <select
            v-model="selectedGroup"
            class="w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2 text-sm"
          >
            <option value="">Todos los grupos</option>
            <option v-for="group in groupOptions" :key="group" :value="group">
              Grupo {{ group }}
            </option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="mb-1 block text-xs text-slate-400">Selección</span>
          <SearchSelect
            v-model="selectedTeamId"
            :options="teamOptions"
            placeholder="Todas las selecciones"
            searchable
          />
        </label>
      </div>

      <p v-if="hasActiveFilters" class="mt-3 text-xs text-slate-500">
        Mostrando {{ items.length }} de {{ predictions.length }} predicciones
      </p>
    </div>

    <p v-if="loading" class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
      Cargando predicciones...
    </p>

    <p
      v-else-if="!predictions.length"
      class="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400"
    >
      {{ emptyMessage }}
    </p>

    <p
      v-else-if="!items.length"
      class="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400"
    >
      No hay predicciones con estos filtros.
    </p>

    <ul v-else class="space-y-3">
      <li
        v-for="{ entry, summary, status } in items"
        :key="entry.id"
        class="rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <RouterLink
              v-if="entry.match && showMatchLink"
              :to="`/match/${entry.match_id}`"
              class="block truncate font-medium text-white hover:text-mundial-accent"
            >
              {{ matchLabel(entry) }}
            </RouterLink>
            <p v-else class="truncate font-medium text-white">{{ matchLabel(entry) }}</p>
            <p v-if="matchScore(entry)" class="mt-0.5 text-xs tabular-nums text-slate-400">
              Resultado real: {{ matchScore(entry) }}
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="statusBadgeClass[status.kind]"
          >
            {{ status.label }}
          </span>
        </div>

        <div class="flex items-start gap-2 text-sm">
          <Target class="mt-0.5 h-4 w-4 shrink-0 text-mundial-accent" />
          <div>
            <p class="font-medium text-slate-200">{{ summary }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ status.detail }}</p>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
          <span v-if="entry.created_at" class="inline-flex items-center gap-1">
            <Clock class="h-3.5 w-3.5" />
            {{ new Date(entry.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
          </span>
          <RouterLink
            v-if="entry.match && showMatchLink"
            :to="`/match/${entry.match_id}`"
            class="inline-flex items-center gap-0.5 font-medium text-mundial-accent hover:underline"
          >
            Ver partido
            <ChevronRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>
      </li>
    </ul>
  </section>
</template>
