<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Grid3x3, LayoutGrid, Radio, Trophy } from '@lucide/vue'
import HomeSpotlightMatch from '@/components/home/HomeSpotlightMatch.vue'
import MatchCard from '@/components/shared/MatchCard.vue'
import { useMatchLifecycleClock } from '@/composables/useMatchLifecycleClock'
import { JORNADAS_PATH, MUNDIAL_PATH, RANKING_PATH } from '@/constants/nav'
import { isEffectivelyLive, isRecentlyFinished, matchSortTime, pickSpotlightMatch } from '@/lib/matchLifecycle'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useMatchStore } from '@/stores/matchStore'

const matchStore = useMatchStore()
const baseStore = useBaseQuinielaStore()
const lifecycleNow = useMatchLifecycleClock()

onMounted(() => {
  void baseStore.fetchRounds()
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

const upcomingMatches = computed(() =>
  matchStore.matches
    .filter(
      (m) =>
        m.id !== spotlightMatch.value?.id &&
        m.status !== 'finished' &&
        !isRecentlyFinished(m, lifecycleNow.value) &&
        !isEffectivelyLive(m) &&
        m.match_date,
    )
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())
    .slice(0, 3),
)

const recentFinishedMatches = computed(() =>
  matchStore.matches
    .filter((m) => isRecentlyFinished(m, lifecycleNow.value) && m.id !== spotlightMatch.value?.id)
    .sort((a, b) => matchSortTime(b) - matchSortTime(a))
    .slice(0, 3),
)

const hasMatchContent = computed(
  () => !!spotlightMatch.value || recentFinishedMatches.value.length > 0,
)

const activeRoundHref = computed(() =>
  baseStore.activeRound ? `/jornadas/${baseStore.activeRound.id}` : JORNADAS_PATH,
)

const loading = computed(() => !matchStore.matches.length && matchStore.loading)
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-white/10 theme-surface-gradient-via">
    <div v-if="loading" class="p-6">
      <div class="mb-4 h-5 w-32 animate-pulse rounded-lg bg-white/10" />
      <div class="h-44 animate-pulse rounded-2xl bg-white/5" />
    </div>

    <template v-else-if="hasMatchContent">
      <div v-if="spotlightMatch" class="p-4 sm:p-5">
        <HomeSpotlightMatch
          :match="spotlightMatch"
          :is-live="spotlightIsLive"
          :is-recently-finished="spotlightIsRecentlyFinished"
        />

        <div v-if="otherLiveMatches.length" class="mt-3 flex flex-wrap gap-2">
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
        v-if="upcomingMatches.length"
        class="border-t border-white/10 px-4 py-4 sm:px-5"
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Después
        </p>
        <div class="space-y-2">
          <MatchCard
            v-for="match in upcomingMatches"
            :key="match.id"
            :match="match"
            :linkable="false"
          />
        </div>
      </div>

      <div
        v-if="recentFinishedMatches.length"
        class="border-t border-white/10 px-4 py-4 sm:px-5"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {{ recentFinishedMatches.length === 1 ? 'Último resultado' : 'Últimos resultados' }}
          </p>
          <RouterLink
            :to="MUNDIAL_PATH"
            class="text-xs font-medium text-mundial-accent transition hover:text-mundial-accent/80"
          >
            Ver más
          </RouterLink>
        </div>
        <div class="space-y-2">
          <MatchCard
            v-for="match in recentFinishedMatches"
            :key="match.id"
            :match="match"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row sm:p-5">
        <RouterLink
          :to="activeRoundHref"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mundial-green px-4 py-3.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
        >
          <Grid3x3 class="h-4 w-4" />
          {{ baseStore.activeRound ? `Jornada ${baseStore.activeRound.round_number}` : 'Ir a quiniela' }}
        </RouterLink>
        <RouterLink
          :to="MUNDIAL_PATH"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <LayoutGrid class="h-4 w-4" />
          Ver mundial
          <ChevronRight class="h-4 w-4 opacity-60" />
        </RouterLink>
      </div>
    </template>

    <div v-else class="p-8 text-center">
      <p class="text-sm font-medium text-slate-300">No hay partidos programados por ahora</p>
      <p class="mt-1 text-xs text-slate-500">Vuelve pronto o explora el torneo</p>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <RouterLink
          :to="MUNDIAL_PATH"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200"
        >
          <LayoutGrid class="h-4 w-4" />
          Explorar mundial
        </RouterLink>
        <RouterLink
          :to="RANKING_PATH"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-mundial-accent/15 px-4 py-3 text-sm font-semibold text-mundial-accent"
        >
          <Trophy class="h-4 w-4" />
          Ver ranking
        </RouterLink>
      </div>
    </div>
  </section>
</template>
