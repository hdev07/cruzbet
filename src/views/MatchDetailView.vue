<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MapPin, Radio } from '@lucide/vue'
import BroadcastBadge from '@/components/shared/BroadcastBadge.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import MatchCardsList from '@/components/shared/MatchCardsList.vue'
import MatchGoalsList from '@/components/shared/MatchGoalsList.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import DuelBarRow from '@/components/charts/DuelBarRow.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import {
  formatLiveStatusLabel,
  formatScheduledStatusLabel,
  isMatchHalftime,
  isMatchInterrupted,
  LIVE_STATUS_DETAIL_LABELS,
} from '@/lib/matchClock'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { fetchMatchById, type MatchWithCompetition } from '@/lib/matchDetail'
import { formatKickoff } from '@/lib/matchRules'
import { formatMatchVenue } from '@/lib/matchVenue'
import { friendlyLoadError } from '@/lib/offlineCache'
import { teamDisplayName } from '@/lib/teamDisplay'
import {
  buildRadarAxes,
  fetchLeagueSeasonAverages,
  fetchMatchBoxscore,
  fetchTeamMatchStats,
  summarizeSeasonAverages,
  type MatchBoxscoreRow,
  type RadarAxis,
} from '@/lib/teamSeasonStats'
import { useMatchStore } from '@/stores/matchStore'

const route = useRoute()
const router = useRouter()
const matchStore = useMatchStore()

const matchId = computed(() => route.params.id as string)
const loading = ref(false)
const loadError = ref<string | null>(null)
const match = ref<MatchWithCompetition | null>(null)

let refreshTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  loading.value = true
  loadError.value = null
  match.value = null
  try {
    match.value = await fetchMatchById(matchId.value)
    if (match.value) {
      await matchStore.fetchEvents(match.value.id)
    }
  } catch (err) {
    loadError.value = friendlyLoadError(err, 'No se pudo cargar el partido')
  } finally {
    loading.value = false
  }
}

function stopRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function startRefresh() {
  stopRefresh()
  refreshTimer = setInterval(async () => {
    if (!match.value) return
    const fresh = await fetchMatchById(match.value.id)
    if (fresh) match.value = fresh
    void matchStore.fetchEvents(matchId.value)
  }, 30_000)
}

async function loadAndMaybeRefresh() {
  await load()
  if (match.value && isEffectivelyLive(match.value)) {
    startRefresh()
  } else {
    stopRefresh()
  }
}

onMounted(loadAndMaybeRefresh)
watch(matchId, loadAndMaybeRefresh)
onUnmounted(stopRefresh)

const isLive = computed(() => (match.value ? isEffectivelyLive(match.value) : false))
const isFinished = computed(() => match.value?.status === 'finished')
const interrupted = computed(() => (match.value ? isMatchInterrupted(match.value) : false))
const halftime = computed(() => (match.value ? isMatchHalftime(match.value) : false))
const showScore = computed(() => isLive.value || isFinished.value)

const statusLabel = computed(() => {
  if (!match.value) return ''
  if (isLive.value || interrupted.value) return formatLiveStatusLabel(match.value)
  if (isFinished.value) return 'Finalizado'
  return formatScheduledStatusLabel(match.value) ?? formatKickoff(match.value) ?? 'Programado'
})

const interruptedLabel = computed(() =>
  match.value?.live_status_detail
    ? LIVE_STATUS_DETAIL_LABELS[match.value.live_status_detail]
    : null,
)

const events = computed(() => (match.value ? matchStore.getEventsForMatch(match.value.id) : []))

type ComparativeData = {
  boxscore: { home: MatchBoxscoreRow | null; away: MatchBoxscoreRow | null } | null
  radarSeries: Array<{ key: string; label: string; color: string; axes: RadarAxis[] }>
  radarLabels: string[]
}

const comparative = ref<ComparativeData | null>(null)
const comparativeLoading = ref(false)

async function loadComparative() {
  comparative.value = null
  const current = match.value
  if (!current?.home_team_id || !current?.away_team_id || !current?.competition_id) return

  comparativeLoading.value = true
  try {
    const [boxscoreRows, leagueAveragesMap] = await Promise.all([
      fetchMatchBoxscore(current.id),
      fetchLeagueSeasonAverages(current.competition_id),
    ])

    const boxscore = boxscoreRows.length
      ? {
          home: boxscoreRows.find((row) => row.teamId === current.home_team_id) ?? null,
          away: boxscoreRows.find((row) => row.teamId === current.away_team_id) ?? null,
        }
      : null

    const leagueAverages = [...leagueAveragesMap.values()]
    const [homeStatPoints, awayStatPoints] = await Promise.all([
      fetchTeamMatchStats(current.home_team_id, current.competition_id),
      fetchTeamMatchStats(current.away_team_id, current.competition_id),
    ])

    const radarSeries: ComparativeData['radarSeries'] = []
    let radarLabels: string[] = []
    if (homeStatPoints.length) {
      const axes = buildRadarAxes(summarizeSeasonAverages(current.home_team_id, homeStatPoints), leagueAverages)
      radarLabels = axes.map((axis) => axis.label)
      radarSeries.push({
        key: 'home',
        label: teamDisplayName(current.home_team, 'Local'),
        color: 'var(--color-mundial-accent)',
        axes,
      })
    }
    if (awayStatPoints.length) {
      const axes = buildRadarAxes(summarizeSeasonAverages(current.away_team_id, awayStatPoints), leagueAverages)
      radarLabels = radarLabels.length ? radarLabels : axes.map((axis) => axis.label)
      radarSeries.push({
        key: 'away',
        label: teamDisplayName(current.away_team, 'Visitante'),
        color: 'var(--color-mundial-error)',
        axes,
      })
    }

    comparative.value = { boxscore, radarSeries, radarLabels }
  } finally {
    comparativeLoading.value = false
  }
}

watch(match, (value) => {
  if (value) loadComparative()
})

function passAccuracy(row: MatchBoxscoreRow | null): number | null {
  return row?.passesTotal && row.passesAccurate
    ? Math.round((row.passesAccurate / row.passesTotal) * 100)
    : null
}

const boxscoreRows = computed(() => {
  const box = comparative.value?.boxscore
  if (!box || (!box.home && !box.away)) return []
  return [
    { label: 'Posesión', unit: '%', home: box.home?.possessionPct ?? null, away: box.away?.possessionPct ?? null },
    { label: 'Tiros', unit: '', home: box.home?.shotsTotal ?? null, away: box.away?.shotsTotal ?? null },
    {
      label: 'Tiros a puerta',
      unit: '',
      home: box.home?.shotsOnTarget ?? null,
      away: box.away?.shotsOnTarget ?? null,
    },
    { label: 'Córners', unit: '', home: box.home?.corners ?? null, away: box.away?.corners ?? null },
    { label: 'Faltas', unit: '', home: box.home?.fouls ?? null, away: box.away?.fouls ?? null },
    { label: 'Precisión de pase', unit: '%', home: passAccuracy(box.home), away: passAccuracy(box.away) },
  ]
})
</script>

<template>
  <div>
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-mundial-green"
      @click="router.back()"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver
    </button>

    <div v-if="loading" class="space-y-4">
      <DataSkeleton variant="match-grid" :rows="1" />
      <DataSkeleton variant="list" :rows="4" />
    </div>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <p v-else-if="!match" class="rounded-lg bg-white/5 px-3 py-2 text-sm text-app-muted">
      No encontramos este partido.
    </p>

    <article
      v-else
      class="overflow-hidden rounded-2xl border theme-surface-gradient-via"
      :class="
        interrupted
          ? 'border-amber-400/40 ring-1 ring-amber-400/30'
          : isLive
            ? halftime
              ? 'border-mundial-accent/45 ring-1 ring-mundial-accent/30'
              : 'border-mundial-green/40 ring-1 ring-mundial-green/25'
            : 'border-white/10'
      "
    >
      <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p
            v-if="match.competition"
            class="text-xs font-semibold uppercase tracking-wider text-mundial-accent"
          >
            {{ match.competition.name }} · {{ match.competition.season }}
          </p>
          <p
            class="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold"
            :class="
              interrupted
                ? 'text-amber-400'
                : isLive
                  ? halftime
                    ? 'text-mundial-accent'
                    : 'text-mundial-green'
                  : 'text-app-muted'
            "
          >
            <Radio v-if="isLive && !interrupted && !halftime" class="h-3.5 w-3.5" />
            {{ statusLabel }}
          </p>
        </div>
        <p v-if="match.phase" class="text-xs text-app-muted">
          {{ match.phase }}
        </p>
      </div>

      <div class="px-4 py-6 sm:px-6 sm:py-8">
        <div class="flex items-center justify-between gap-3 sm:gap-6">
          <RouterLink
            v-if="match.home_team?.code"
            :to="`/tablas/equipo/${match.home_team.code}`"
            class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center hover:text-mundial-accent"
          >
            <TeamFlag
              :src="match.home_team?.flag_url"
              :code="match.home_team?.code"
              :alt="teamDisplayName(match.home_team, 'Local')"
              size="lg"
              img-class="h-14 w-14 sm:h-16 sm:w-16"
            />
            <span class="w-full truncate text-sm font-semibold sm:text-base">
              {{ teamDisplayName(match.home_team, 'Local') }}
            </span>
          </RouterLink>
          <div v-else class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamFlag
              :src="match.home_team?.flag_url"
              :code="match.home_team?.code"
              :alt="teamDisplayName(match.home_team, 'Local')"
              size="lg"
              img-class="h-14 w-14 sm:h-16 sm:w-16"
            />
            <span class="w-full truncate text-sm font-semibold sm:text-base">
              {{ teamDisplayName(match.home_team, 'Local') }}
            </span>
          </div>

          <div class="shrink-0 text-center">
            <p v-if="showScore" class="text-4xl font-black tabular-nums tracking-tight sm:text-5xl">
              {{ match.home_score }}
              <span class="mx-1 text-app-muted">-</span>
              {{ match.away_score }}
            </p>
            <p v-else class="text-2xl font-bold text-app-muted sm:text-3xl">VS</p>
            <LiveMatchPulse v-if="isLive && !halftime && !interrupted" class="live-pulse-under-score" />
            <p
              v-if="!isLive && match.match_date"
              class="mt-1 text-[11px] text-app-muted sm:text-xs"
            >
              {{ formatKickoff(match) }}
            </p>
          </div>

          <RouterLink
            v-if="match.away_team?.code"
            :to="`/tablas/equipo/${match.away_team.code}`"
            class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center hover:text-mundial-accent"
          >
            <TeamFlag
              :src="match.away_team?.flag_url"
              :code="match.away_team?.code"
              :alt="teamDisplayName(match.away_team, 'Visitante')"
              size="lg"
              img-class="h-14 w-14 sm:h-16 sm:w-16"
            />
            <span class="w-full truncate text-sm font-semibold sm:text-base">
              {{ teamDisplayName(match.away_team, 'Visitante') }}
            </span>
          </RouterLink>
          <div v-else class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamFlag
              :src="match.away_team?.flag_url"
              :code="match.away_team?.code"
              :alt="teamDisplayName(match.away_team, 'Visitante')"
              size="lg"
              img-class="h-14 w-14 sm:h-16 sm:w-16"
            />
            <span class="w-full truncate text-sm font-semibold sm:text-base">
              {{ teamDisplayName(match.away_team, 'Visitante') }}
            </span>
          </div>
        </div>

        <div
          v-if="match.venue || match.broadcast_channel"
          class="mt-4 flex flex-col items-center gap-1.5 text-center text-xs text-app-muted"
        >
          <span v-if="match.venue" class="inline-flex items-center gap-1">
            <MapPin class="h-3.5 w-3.5 shrink-0 opacity-70" />
            {{ formatMatchVenue(match.venue) }}
          </span>
          <BroadcastBadge
            v-if="match.broadcast_channel"
            :channels="match.broadcast_channel"
            :max="3"
            size="md"
            class="mt-1"
          />
        </div>

        <p
          v-if="halftime"
          class="mt-4 rounded-lg bg-mundial-accent/10 px-3 py-2 text-center text-xs font-semibold text-mundial-accent"
          role="status"
          aria-live="polite"
        >
          Entretiempo · El reloj se reanudará al comenzar el segundo tiempo
        </p>
        <p
          v-else-if="interrupted && interruptedLabel"
          class="mt-4 rounded-lg bg-amber-400/10 px-3 py-2 text-center text-xs font-semibold text-amber-300"
          role="status"
          aria-live="polite"
        >
          Partido {{ interruptedLabel.toLowerCase() }}
        </p>
      </div>

      <div
        v-if="comparativeLoading || boxscoreRows.length || comparative?.radarSeries.length"
        class="space-y-4 border-t border-white/10 px-4 py-4 sm:px-5"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">Comparativa</h3>

        <div v-if="comparativeLoading" class="space-y-2">
          <DataSkeleton variant="list" :rows="3" />
        </div>

        <template v-else>
          <div v-if="boxscoreRows.length" class="rounded-xl border border-app-border bg-app-surface-elevated p-3">
            <DuelBarRow
              v-for="row in boxscoreRows"
              :key="row.label"
              :label="row.label"
              :unit="row.unit"
              :home-value="row.home"
              :away-value="row.away"
            />
          </div>

          <div v-if="comparative?.radarSeries.length" class="rounded-xl border border-app-border bg-app-surface-elevated p-3">
            <p class="mb-2 text-center text-xs text-app-muted">Radar de rendimiento de temporada</p>
            <RadarChart :labels="comparative.radarLabels" :series="comparative.radarSeries" />
          </div>
        </template>
      </div>

      <MatchGoalsList :match="match" :events="events" :max-items="0" />
      <MatchCardsList :match="match" :events="events" :max-items="0" />

      <p
        v-if="isFinished && !events.length"
        class="border-t border-white/10 px-4 py-3 text-center text-xs text-app-muted sm:px-5"
      >
        No se registraron goles ni tarjetas en este partido.
      </p>
      <p
        v-else-if="!isLive && !isFinished"
        class="border-t border-white/10 px-4 py-3 text-center text-xs text-app-muted sm:px-5"
      >
        Los eventos del partido se mostrarán aquí cuando comience.
      </p>
    </article>
  </div>
</template>
