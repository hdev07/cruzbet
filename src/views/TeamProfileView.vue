<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import MatchRowCard from '@/components/home/MatchRowCard.vue'
import MatchSpotlight from '@/components/home/MatchSpotlight.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { friendlyLoadError } from '@/lib/offlineCache'
import { fetchTeamHistory, type TeamHistory } from '@/lib/teamHistory'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { Match } from '@/types'

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
