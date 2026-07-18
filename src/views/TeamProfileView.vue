<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import MatchRowCard from '@/components/home/MatchRowCard.vue'
import MatchSpotlight from '@/components/home/MatchSpotlight.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import GroupedBarChart from '@/components/charts/GroupedBarChart.vue'
import LineTrendChart from '@/components/charts/LineTrendChart.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import ScatterChart from '@/components/charts/ScatterChart.vue'
import { LIGA_MX_CLUBS } from '@/constants/tablas'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { friendlyLoadError } from '@/lib/offlineCache'
import { fetchTeamHistory, type TeamHistory } from '@/lib/teamHistory'
import { teamDisplayName } from '@/lib/teamDisplay'
import {
  buildFormPoints,
  buildGoalsByJornada,
  buildGoalsByPeriod,
  buildHomeAwaySplit,
  fetchGoalEvents,
  fetchJornadaByMatch,
  fetchStandingsProgression,
  type StandingsProgressionPoint,
} from '@/lib/teamPerformance'
import {
  buildRadarAxes,
  fetchLeagueSeasonAverages,
  fetchTeamMatchStats,
  summarizeSeasonAverages,
  type RadarAxis,
  type TeamMatchStatPoint,
} from '@/lib/teamSeasonStats'
import type { Match } from '@/types'

const LIGA_MX_PARTICIPANTS = LIGA_MX_CLUBS.map((club) => ({ code: club.code, name: club.name }))

const route = useRoute()

const teamCode = computed(() => (route.params.code as string).toUpperCase())
const loading = ref(false)
const loadError = ref<string | null>(null)
const history = ref<TeamHistory | null>(null)

async function load() {
  loading.value = true
  loadError.value = null
  history.value = null
  try {
    history.value = await fetchTeamHistory(teamCode.value)
  } catch (err) {
    loadError.value = friendlyLoadError(err, 'No se pudo cargar el historial del equipo')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(teamCode, load)

const liveMatch = computed(() => history.value?.matches.find((m) => isEffectivelyLive(m)) ?? null)
const nextMatch = computed(() => history.value?.matches.find((m) => m.status === 'scheduled') ?? null)
const lastFinishedMatch = computed(() => {
  const finished = history.value?.matches.filter((m) => m.status === 'finished') ?? []
  return finished.length ? finished[finished.length - 1] : null
})
const featuredMatch = computed(() => liveMatch.value ?? nextMatch.value ?? lastFinishedMatch.value)
const calendarMatches = computed(() =>
  (history.value?.matches ?? []).filter((m) => m.id !== featuredMatch.value?.id),
)

const FORM_LABELS: Record<'G' | 'E' | 'P', string> = { G: 'Ganó', E: 'Empató', P: 'Perdió' }
const FORM_CLASSES: Record<'G' | 'E' | 'P', string> = {
  G: 'border-mundial-green/30 bg-mundial-green/10 text-mundial-green',
  E: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  P: 'border-red-500/30 bg-red-500/10 text-red-300',
}

const recentForm = computed(() => {
  const code = history.value?.team.code
  if (!code) return []
  return history.value!.matches
    .filter((m) => m.status === 'finished')
    .slice(-5)
    .reverse()
    .map((m) => {
      const isHome = m.home_team?.code === code
      const goalsFor = isHome ? m.home_score : m.away_score
      const goalsAgainst = isHome ? m.away_score : m.home_score
      const opponent = isHome ? m.away_team : m.home_team
      const result: 'G' | 'E' | 'P' =
        goalsFor > goalsAgainst ? 'G' : goalsFor < goalsAgainst ? 'P' : 'E'
      return { match: m, result, goalsFor, goalsAgainst, opponent }
    })
})

type PerformanceData = {
  formPoints: ReturnType<typeof buildFormPoints>
  homeAway: ReturnType<typeof buildHomeAwaySplit>
  goalsByJornada: ReturnType<typeof buildGoalsByJornada>
  goalsByPeriod: ReturnType<typeof buildGoalsByPeriod>
  standingsProgression: StandingsProgressionPoint[]
  radarAxes: RadarAxis[]
  opponentRadarAxes: RadarAxis[] | null
  opponentName: string | null
  possessionScatter: Array<{ label: string; x: number; y: number }>
}

const performance = ref<PerformanceData | null>(null)
const performanceLoading = ref(false)

async function loadPerformance() {
  performance.value = null
  const currentHistory = history.value
  if (!currentHistory) return

  const currentCompetitionId = currentHistory.byCompetition[0]?.competitionId
  if (!currentCompetitionId) return

  performanceLoading.value = true
  try {
    const teamId = currentHistory.team.id
    const seasonMatches = currentHistory.matches.filter(
      (m) => m.competition_id === currentCompetitionId,
    )
    const matchIds = seasonMatches.map((m) => m.id)

    const [jornadaByMatch, goalEvents, standingsProgression, teamStatPoints, leagueAveragesMap] =
      await Promise.all([
        fetchJornadaByMatch(currentCompetitionId),
        fetchGoalEvents(matchIds),
        fetchStandingsProgression(currentCompetitionId, currentHistory.team.code, LIGA_MX_PARTICIPANTS),
        fetchTeamMatchStats(teamId, currentCompetitionId),
        fetchLeagueSeasonAverages(currentCompetitionId),
      ])

    const leagueAverages = [...leagueAveragesMap.values()]
    const teamAverages = summarizeSeasonAverages(teamId, teamStatPoints)
    const radarAxes = buildRadarAxes(teamAverages, leagueAverages)

    let opponentRadarAxes: RadarAxis[] | null = null
    let opponentLabel: string | null = null
    const upcoming = nextMatch.value
    if (upcoming) {
      const opponentTeam = upcoming.home_team?.id === teamId ? upcoming.away_team : upcoming.home_team
      if (opponentTeam?.id) {
        const opponentPoints = await fetchTeamMatchStats(opponentTeam.id, currentCompetitionId)
        if (opponentPoints.length) {
          const opponentAverages = summarizeSeasonAverages(opponentTeam.id, opponentPoints)
          opponentRadarAxes = buildRadarAxes(opponentAverages, leagueAverages)
          opponentLabel = teamDisplayName(opponentTeam, opponentTeam.name)
        }
      }
    }

    performance.value = {
      formPoints: buildFormPoints(currentHistory.matches, teamId),
      homeAway: buildHomeAwaySplit(currentHistory.matches, teamId),
      goalsByJornada: buildGoalsByJornada(seasonMatches, jornadaByMatch, teamId),
      goalsByPeriod: buildGoalsByPeriod(goalEvents, seasonMatches, teamId),
      standingsProgression,
      radarAxes,
      opponentRadarAxes,
      opponentName: opponentLabel,
      possessionScatter: teamStatPoints
        .filter((point): point is TeamMatchStatPoint & { possessionPct: number } => point.possessionPct !== null)
        .map((point, index) => ({ label: `Partido ${index + 1}`, x: point.possessionPct, y: point.points })),
    }
  } finally {
    performanceLoading.value = false
  }
}

watch(history, (value) => {
  if (value) loadPerformance()
})

const formPointsChart = computed(() => {
  const points = performance.value?.formPoints ?? []
  return {
    categories: points.map((_, index) => `${index + 1}`),
    series: [
      {
        key: 'points',
        label: 'Puntos',
        color: 'var(--color-mundial-accent)',
        values: points.map((p) => p.points),
      },
    ],
  }
})

const goalsByJornadaChart = computed(() => {
  const rows = performance.value?.goalsByJornada ?? []
  return {
    categories: rows.map((row) => `J${row.jornada}`),
    goals: [
      { key: 'gf', label: 'A favor', color: 'var(--color-mundial-green)', values: rows.map((r) => r.goalsFor) },
      { key: 'gc', label: 'En contra', color: 'var(--color-mundial-error)', values: rows.map((r) => r.goalsAgainst) },
    ],
    diff: [
      {
        key: 'diff',
        label: 'Diferencia',
        color: 'var(--color-mundial-accent)',
        values: rows.map((r) => r.goalDiff),
      },
    ],
  }
})

const goalsByPeriodChart = computed(() => {
  const rows = performance.value?.goalsByPeriod ?? []
  return {
    categories: rows.map((row) => row.label),
    series: [
      { key: 'scored', label: 'Anotados', color: 'var(--color-mundial-green)', values: rows.map((r) => r.scored) },
      { key: 'conceded', label: 'Recibidos', color: 'var(--color-mundial-error)', values: rows.map((r) => r.conceded) },
    ],
  }
})

const standingsProgressionChart = computed(() => {
  const rows = performance.value?.standingsProgression ?? []
  return {
    categories: rows.map((row) => `J${row.jornada}`),
    series: [
      {
        key: 'position',
        label: 'Posición',
        color: 'var(--color-mundial-accent)',
        values: rows.map((row) => row.position),
      },
    ],
  }
})

const homeAwayChart = computed(() => {
  const split = performance.value?.homeAway
  if (!split) return { categories: [] as string[], series: [] as { key: string; label: string; color: string; values: number[] }[] }
  return {
    categories: ['Local', 'Visitante'],
    series: [
      {
        key: 'ppm',
        label: 'Pts/partido',
        color: 'var(--color-mundial-accent)',
        values: [split.home.pointsPerMatch, split.away.pointsPerMatch],
      },
      {
        key: 'gf',
        label: 'GF/partido',
        color: 'var(--color-mundial-green)',
        values: [split.home.goalsForPerMatch, split.away.goalsForPerMatch],
      },
      {
        key: 'gc',
        label: 'GC/partido',
        color: 'var(--color-mundial-error)',
        values: [split.home.goalsAgainstPerMatch, split.away.goalsAgainstPerMatch],
      },
    ],
  }
})

const radarSeries = computed(() => {
  if (!performance.value) return []
  const teamName = history.value?.team.name ?? 'Equipo'
  const series = [
    { key: 'team', label: teamName, color: 'var(--color-mundial-accent)', axes: performance.value.radarAxes },
  ]
  if (performance.value.opponentRadarAxes && performance.value.opponentName) {
    series.push({
      key: 'opponent',
      label: performance.value.opponentName,
      color: 'var(--color-mundial-error)',
      axes: performance.value.opponentRadarAxes,
    })
  }
  return series
})

const overallTotals = computed(() => {
  const rows = history.value?.byCompetition ?? []
  if (rows.length < 2) return null
  return rows.reduce(
    (acc, row) => ({
      played: acc.played + row.played,
      won: acc.won + row.won,
      drawn: acc.drawn + row.drawn,
      lost: acc.lost + row.lost,
      goalsFor: acc.goalsFor + row.goalsFor,
      goalsAgainst: acc.goalsAgainst + row.goalsAgainst,
      goalDiff: acc.goalDiff + row.goalDiff,
      points: acc.points + row.points,
    }),
    { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
  )
})

function opponentName(match: Match, code: string) {
  const opponent = match.home_team?.code === code ? match.away_team : match.home_team
  return teamDisplayName(opponent, 'Rival')
}
</script>

<template>
  <div>
    <RouterLink
      to="/tablas"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-mundial-green"
    >
      <ArrowLeft class="h-4 w-4" />
      Tablas
    </RouterLink>

    <div v-if="loading" class="space-y-6">
      <div class="flex items-center gap-3">
        <div class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-white/10" />
        <div class="h-6 w-40 animate-pulse rounded bg-white/10" />
      </div>
      <DataSkeleton variant="table" :rows="3" />
      <DataSkeleton variant="list" :rows="4" />
    </div>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <p v-else-if="!history" class="rounded-lg bg-white/5 px-3 py-2 text-sm text-app-muted">
      No encontramos un equipo con el código "{{ teamCode }}".
    </p>

    <template v-else>
      <header class="mb-6 flex items-center gap-3">
        <TeamFlag
          :src="history.team.crestUrl"
          :code="history.team.code"
          :alt="history.team.name"
          size="lg"
          img-class="h-14 w-14"
        />
        <div>
          <h1 class="text-2xl font-bold lg:text-3xl">{{ history.team.name }}</h1>
          <p class="mt-0.5 text-sm text-app-muted">
            {{ history.matches.length }}
            {{ history.matches.length === 1 ? 'partido registrado' : 'partidos registrados' }}
          </p>
        </div>
      </header>

      <section v-if="featuredMatch" class="mb-8">
        <MatchSpotlight :match="featuredMatch" :is-live="isEffectivelyLive(featuredMatch)" />
      </section>

      <section v-if="recentForm.length" class="mb-8">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Forma reciente
        </h2>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="item in recentForm"
            :key="item.match.id"
            :to="item.opponent?.code ? `/tablas/equipo/${item.opponent.code}` : ''"
            class="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium"
            :class="FORM_CLASSES[item.result]"
            :title="`${FORM_LABELS[item.result]} ${item.goalsFor}-${item.goalsAgainst} vs ${opponentName(item.match, history.team.code)}`"
          >
            <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-black/20 text-[11px] font-bold">
              {{ item.result }}
            </span>
            <TeamFlag
              :src="item.opponent?.flag_url"
              :code="item.opponent?.code"
              :alt="opponentName(item.match, history.team.code)"
              size="sm"
            />
            <span class="tabular-nums">{{ item.goalsFor }}-{{ item.goalsAgainst }}</span>
          </RouterLink>
        </div>
      </section>

      <section v-if="performanceLoading || performance" class="mb-8 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Rendimiento
        </h2>

        <div v-if="performanceLoading" class="space-y-3">
          <DataSkeleton variant="table" :rows="2" />
        </div>

        <div v-else-if="performance" class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <div class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4">
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Radar de rendimiento</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">
                Comparado contra el promedio de la liga
                <span v-if="performance.opponentName"> · vs. {{ performance.opponentName }}</span>
              </p>
            </header>
            <RadarChart :labels="performance.radarAxes.map((a) => a.label)" :series="radarSeries" />
          </div>

          <div class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4">
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Puntos por partido</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">
                3 = victoria · 1 = empate · 0 = derrota
              </p>
            </header>
            <LineTrendChart
              :categories="formPointsChart.categories"
              :series="formPointsChart.series"
              :y-domain="[0, 3]"
            />
          </div>

          <div
            v-if="standingsProgressionChart.categories.length"
            class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4"
          >
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Evolución en la tabla</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">Posición acumulada por jornada</p>
            </header>
            <LineTrendChart
              :categories="standingsProgressionChart.categories"
              :series="standingsProgressionChart.series"
              :invert-y="true"
              :y-domain="[1, 18]"
            />
          </div>

          <div
            v-if="homeAwayChart.categories.length"
            class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4"
          >
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Local vs. visitante</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">Promedios por partido según la sede</p>
            </header>
            <GroupedBarChart :categories="homeAwayChart.categories" :series="homeAwayChart.series" />
          </div>

          <div
            v-if="goalsByJornadaChart.categories.length"
            class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4 lg:col-span-2"
          >
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Goles por jornada</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">Anotados vs. recibidos, con diferencia</p>
            </header>
            <GroupedBarChart :categories="goalsByJornadaChart.categories" :series="goalsByJornadaChart.goals" />
            <div class="mt-3 border-t border-app-border/60 pt-3">
              <LineTrendChart :categories="goalsByJornadaChart.categories" :series="goalsByJornadaChart.diff" />
            </div>
          </div>

          <div
            v-if="goalsByPeriodChart.categories.length"
            class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4"
          >
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Goles por periodo</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">Cuándo anota y recibe goles</p>
            </header>
            <GroupedBarChart :categories="goalsByPeriodChart.categories" :series="goalsByPeriodChart.series" />
          </div>

          <div
            v-if="performance.possessionScatter.length"
            class="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-3 sm:p-4"
          >
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-app-text">Posesión vs. resultado</h3>
              <p class="mt-1 text-xs leading-relaxed text-app-muted">Cada punto es un partido</p>
            </header>
            <ScatterChart
              :points="performance.possessionScatter"
              x-label="Posesión %"
              y-label="Puntos"
              :y-domain="[0, 3]"
            />
          </div>
        </div>
      </section>

      <section
        v-if="history.byCompetition.length"
        class="mb-8 overflow-hidden rounded-2xl border border-app-border bg-app-surface"
      >
        <header class="border-b border-app-border px-4 py-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
            Por torneo
          </h2>
        </header>
        <div class="overflow-x-auto app-scrollbar">
          <table class="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr class="bg-app-surface-elevated text-left text-xs uppercase tracking-wide text-app-muted">
                <th class="px-3 py-2.5 font-semibold">Torneo</th>
                <th class="px-2 py-2.5 text-center font-semibold">JJ</th>
                <th class="px-2 py-2.5 text-center font-semibold">G</th>
                <th class="px-2 py-2.5 text-center font-semibold">E</th>
                <th class="px-2 py-2.5 text-center font-semibold">P</th>
                <th class="px-2 py-2.5 text-center font-semibold">GF</th>
                <th class="px-2 py-2.5 text-center font-semibold">GC</th>
                <th class="px-2 py-2.5 text-center font-semibold">DG</th>
                <th class="px-3 py-2.5 text-center font-semibold text-mundial-accent">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in history.byCompetition"
                :key="row.competitionId"
                class="border-t border-app-border/60"
              >
                <td class="px-3 py-2.5">
                  <span class="font-medium text-app-text">{{ row.competitionName }}</span>
                  <span class="ml-1 text-xs text-app-muted">{{ row.competitionSeason }}</span>
                </td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.played }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.won }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.drawn }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.lost }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.goalsFor }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.goalsAgainst }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.goalDiff }}</td>
                <td class="px-3 py-2.5 text-center text-base font-bold tabular-nums text-mundial-accent">
                  {{ row.points }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="overallTotals">
              <tr class="border-t border-app-border bg-app-surface-elevated">
                <td class="px-3 py-2.5 font-semibold text-app-text">Total</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.played }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.won }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.drawn }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.lost }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.goalsFor }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.goalsAgainst }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ overallTotals.goalDiff }}</td>
                <td class="px-3 py-2.5 text-center text-base font-bold tabular-nums text-mundial-accent">
                  {{ overallTotals.points }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Calendario
        </h2>
        <div v-if="calendarMatches.length" class="space-y-2">
          <MatchRowCard v-for="match in calendarMatches" :key="match.id" :match="match" />
        </div>
        <p v-else-if="!history.matches.length" class="rounded-lg bg-white/5 px-3 py-2 text-sm text-app-muted">
          Todavía no hay partidos registrados para este equipo.
        </p>
      </section>
    </template>
  </div>
</template>
