<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, ChevronRight, GitBranch, Goal, Grid3x3, LayoutGrid, Radio } from '@lucide/vue'
import GroupStandingsMiniCard from '@/components/home/GroupStandingsMiniCard.vue'
import HomeSpotlightMatch from '@/components/home/HomeSpotlightMatch.vue'
import BaseQuinielaMatchContext from '@/components/predictions/BaseQuinielaMatchContext.vue'
import GroupStandingsTable from '@/components/shared/GroupStandingsTable.vue'
import MatchCard from '@/components/shared/MatchCard.vue'
import { useMatchLifecycleClock } from '@/composables/useMatchLifecycleClock'
import { ELIMINATORIA_PATH, GRUPOS_PATH, JORNADAS_PATH } from '@/constants/nav'
import { totalGoalsInMatches } from '@/lib/groupStandings'
import {
  groupStageProgress,
  isGroupStageComplete,
  isKnockoutFilled,
} from '@/lib/knockoutBracket'
import { isEffectivelyLive, isRecentlyFinished, pickSpotlightMatch } from '@/lib/matchLifecycle'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useGroupStandingsStore } from '@/stores/groupStandingsStore'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/types'

const matchStore = useMatchStore()
const standingsStore = useGroupStandingsStore()
const lifecycleNow = useMatchLifecycleClock()

onMounted(async () => {
  if (!standingsStore.teams.length) {
    await standingsStore.fetchStandingsData()
  }
})

const liveMatches = computed(() => matchStore.liveMatches)

const spotlightMatch = computed(() =>
  pickSpotlightMatch(matchStore.matches, liveMatches.value, lifecycleNow.value),
)

const spotlightIsLive = computed(
  () => !!spotlightMatch.value && isEffectivelyLive(spotlightMatch.value, lifecycleNow.value),
)

const spotlightIsRecentlyFinished = computed(
  () =>
    !!spotlightMatch.value &&
    !spotlightIsLive.value &&
    isRecentlyFinished(spotlightMatch.value, lifecycleNow.value),
)

const otherLiveMatches = computed(() =>
  liveMatches.value.filter((m) => m.id !== spotlightMatch.value?.id),
)

function localDayKey(date: Date): string {
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function matchDayKey(match: Match): string | null {
  if (!match.match_date) return null
  return localDayKey(new Date(match.match_date))
}

function formatDayHeading(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

const daySheet = computed(() => {
  const now = new Date()
  const todayKey = localDayKey(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = localDayKey(tomorrow)

  const sorted = [...matchStore.matches]
    .filter((m) => m.match_date)
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())

  const today = sorted.filter(
    (m) => matchDayKey(m) === todayKey && (m.status !== 'finished' || isRecentlyFinished(m, lifecycleNow.value)),
  )
  if (today.length) {
    return { label: 'Hoy', matches: today }
  }

  const tomorrowMatches = sorted.filter((m) => matchDayKey(m) === tomorrowKey)
  if (tomorrowMatches.length) {
    return { label: 'Mañana', matches: tomorrowMatches }
  }

  const upcoming = sorted.filter(
    (m) => m.status !== 'finished' && new Date(m.match_date!).getTime() >= now.getTime(),
  )
  if (!upcoming.length) {
    return { label: 'Agenda', matches: [] as Match[] }
  }

  const firstUpcoming = upcoming[0]!
  const nextKey = matchDayKey(firstUpcoming)
  if (!nextKey || !firstUpcoming.match_date) {
    return { label: 'Agenda', matches: upcoming }
  }

  return {
    label: formatDayHeading(firstUpcoming.match_date),
    matches: upcoming.filter((m) => matchDayKey(m) === nextKey),
  }
})

const groupProgress = computed(() =>
  groupStageProgress(standingsStore.teams, matchStore.matches),
)

const bracketStatusLabel = computed(() => {
  if (isKnockoutFilled(matchStore.matches)) return 'Equipos asignados'
  if (isGroupStageComplete(standingsStore.teams, matchStore.matches)) return 'Generando llaves'
  return 'Pendiente grupos'
})

const showSpotlightContext = computed(
  () =>
    !!spotlightMatch.value &&
    !spotlightIsLive.value &&
    spotlightMatch.value.status === 'scheduled',
)

const totalGoals = computed(() => totalGoalsInMatches(standingsStore.groupMatches))

const stats = computed(() => [
  {
    label: 'En vivo',
    value: liveMatches.value.length,
    icon: Radio,
    accent: liveMatches.value.length > 0,
  },
  {
    label: 'Partidos jugados',
    value: standingsStore.groupMatches.filter((m) => m.status === 'finished').length,
    icon: Calendar,
    accent: false,
  },
  {
    label: 'Goles',
    value: totalGoals.value,
    icon: Goal,
    accent: false,
  },
])
</script>

<template>
  <section
    class="overflow-hidden rounded-2xl border border-white/10 theme-surface-gradient"
  >
    <div class="border-b border-white/10 px-4 py-5 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <RouterLink
          :to="GRUPOS_PATH"
          class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-mundial-accent/40 hover:text-mundial-accent"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
          Ver 12 grupos
        </RouterLink>
      </div>

      <RouterLink
        :to="ELIMINATORIA_PATH"
        class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-mundial-accent/40"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <GitBranch class="h-4 w-4 shrink-0 text-mundial-accent" />
          <div class="min-w-0">
            <p class="text-xs font-semibold text-slate-200">Eliminatoria</p>
            <p class="truncate text-[0.65rem] text-slate-500">
              Grupos {{ groupProgress.finished }}/{{ groupProgress.total }}
              · {{ bracketStatusLabel }}
            </p>
          </div>
        </div>
        <ChevronRight class="h-4 w-4 shrink-0 text-slate-500" />
      </RouterLink>

      <div v-if="spotlightMatch">
        <HomeSpotlightMatch
          :match="spotlightMatch"
          :is-live="spotlightIsLive"
          :is-recently-finished="spotlightIsRecentlyFinished"
        />

        <BaseQuinielaMatchContext
          v-if="showSpotlightContext"
          :match="spotlightMatch"
          compact
          class="mt-3"
        />

        <div
          v-if="otherLiveMatches.length"
          class="mt-2 flex flex-wrap gap-2"
        >
          <span
            v-for="match in otherLiveMatches"
            :key="match.id"
            class="inline-flex items-center gap-2 rounded-lg border border-mundial-green/30 bg-mundial-green/10 px-3 py-1.5 text-xs font-medium text-mundial-green"
          >
            <Radio class="h-3 w-3" />
            {{ teamDisplayName(match.home_team, 'Local') }}
            {{ match.home_score }}-{{ match.away_score }}
            {{ teamDisplayName(match.away_team, 'Visit.') }}
          </span>
        </div>
      </div>

      <div
        v-else
        class="mt-4 rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-slate-400"
      >
        No hay partidos programados por ahora.
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-white/10 bg-mundial-dark/40 px-3 py-2.5"
          :class="{ 'border-mundial-green/40 bg-mundial-green/10': stat.accent && stat.label === 'En vivo' }"
        >
          <div class="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
            <component :is="stat.icon" class="h-3 w-3" />
            {{ stat.label }}
          </div>
          <p
            class="text-xl font-bold tabular-nums"
            :class="stat.accent && stat.label === 'En vivo' ? 'text-mundial-green' : 'text-slate-100'"
          >
            {{ stat.value }}
          </p>
        </div>
      </div>
    </div>

    <div class="border-b border-white/10 px-4 py-5 sm:px-6">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
            Tabla de grupos
          </h3>
          <p class="mt-0.5 text-xs text-slate-500">
            Toca un grupo · se actualiza en vivo
          </p>
        </div>
      </div>

      <p v-if="standingsStore.loading" class="text-sm text-slate-400">Cargando tablas...</p>

      <template v-else>
        <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <GroupStandingsMiniCard
            v-for="group in standingsStore.standings"
            :key="group.groupName"
            :group="group"
            :matches="standingsStore.groupMatches"
            :selected="standingsStore.selectedGroup === group.groupName"
            @click="standingsStore.setSelectedGroup(group.groupName)"
          />
        </div>

        <GroupStandingsTable
          v-if="standingsStore.currentStandings"
          :rows="standingsStore.currentStandings.rows"
          :group-name="standingsStore.currentStandings.groupName"
        />

        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-mundial-green" />
            Puestos 1-2: clasifican
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Puesto 3: mejor tercero
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-white/20" />
            Puesto 4: eliminado
          </span>
        </div>
      </template>
    </div>

    <div class="px-4 py-5 sm:px-6">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Agenda del día
          </h3>
          <p v-if="daySheet.matches.length" class="mt-0.5 text-xs capitalize text-slate-500">
            {{ daySheet.label }}
          </p>
        </div>
      </div>

      <div
        v-if="!daySheet.matches.length"
        class="rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-slate-400"
      >
        No hay partidos en la agenda por ahora.
      </div>

      <div v-else class="space-y-3">
        <MatchCard
          v-for="match in daySheet.matches"
          :key="match.id"
          :match="match"
          :linkable="false"
        />
      </div>

      <div class="mt-5 flex flex-col gap-2 sm:flex-row">
        <RouterLink
          :to="JORNADAS_PATH"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mundial-green px-4 py-3 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
        >
          <Grid3x3 class="h-4 w-4" />
          Ir a las jornadas
        </RouterLink>
        <RouterLink
          :to="GRUPOS_PATH"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <LayoutGrid class="h-4 w-4" />
          Explorar todos los grupos
          <ChevronRight class="h-4 w-4 opacity-60" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
