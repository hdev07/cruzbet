<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Grid3x3 } from '@lucide/vue'
import MatchRowCard from '@/components/home/MatchRowCard.vue'
import MatchSpotlight from '@/components/home/MatchSpotlight.vue'
import { useMatchLifecycleClock } from '@/composables/useMatchLifecycleClock'
import { JORNADAS_PATH } from '@/constants/nav'
import {
  isEffectivelyLive,
  isRecentlyFinished,
} from '@/lib/matchLifecycle'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useMatchStore } from '@/stores/matchStore'

const matchStore = useMatchStore()
const baseStore = useBaseQuinielaStore()
const lifecycleNow = useMatchLifecycleClock()

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  void matchStore.fetchMatches()
  void baseStore.fetchRounds()
  refreshTimer = setInterval(() => {
    if (matchStore.liveMatches.length) {
      void matchStore.fetchMatches({ force: true })
    }
  }, 60_000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const spotlightMatches = computed(() => matchStore.spotlightMatches)
const spotlightIds = computed(() => new Set(spotlightMatches.value.map((m) => m.id)))
const hasLiveSpotlight = computed(() =>
  spotlightMatches.value.some((m) => isEffectivelyLive(m)),
)

const upcomingMatches = computed(() =>
  matchStore.upcomingMatches.filter((m) => !spotlightIds.value.has(m.id)).slice(0, 3),
)

const recentFinishedMatches = computed(() =>
  matchStore.recentFinishedMatches
    .filter((m) => !spotlightIds.value.has(m.id))
    .slice(0, 3),
)

const hasMatchContent = computed(
  () =>
    spotlightMatches.value.length > 0 ||
    recentFinishedMatches.value.length > 0 ||
    upcomingMatches.value.length > 0,
)

const activeRoundHref = computed(() =>
  baseStore.activeRound ? `/jornadas/${baseStore.activeRound.id}` : JORNADAS_PATH,
)

const loading = computed(() => matchStore.loading && !matchStore.matches.length)
</script>

<template>
  <section class="space-y-4" aria-label="Encuentros en vivo y próximos">
    <div v-if="loading" class="overflow-hidden rounded-2xl border border-white/10 p-6">
      <div class="mb-4 h-5 w-32 animate-pulse rounded-lg bg-white/10" />
      <div class="h-44 animate-pulse rounded-2xl bg-white/5" />
    </div>

    <template v-else-if="hasMatchContent">
      <div v-if="spotlightMatches.length" class="space-y-3">
        <MatchSpotlight
          v-for="(match, index) in spotlightMatches"
          :key="match.id"
          :match="match"
          :is-live="isEffectivelyLive(match)"
          :is-recently-finished="isRecentlyFinished(match, lifecycleNow)"
          :is-stellar="spotlightMatches.length > 1"
          :stellar-index="index"
          :stellar-count="spotlightMatches.length"
        />
      </div>

      <div
        v-if="upcomingMatches.length"
        class="rounded-2xl border border-white/10 px-4 py-4 sm:px-5"
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-app-muted">
          Después
        </p>
        <div class="space-y-2">
          <MatchRowCard
            v-for="match in upcomingMatches"
            :key="match.id"
            :match="match"
          />
        </div>
      </div>

      <div
        v-if="recentFinishedMatches.length && !hasLiveSpotlight"
        class="rounded-2xl border border-white/10 px-4 py-4 sm:px-5"
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-app-muted">
          {{ recentFinishedMatches.length === 1 ? 'Último resultado' : 'Últimos resultados' }}
        </p>
        <div class="space-y-2">
          <MatchRowCard
            v-for="match in recentFinishedMatches"
            :key="match.id"
            :match="match"
          />
        </div>
      </div>

      <RouterLink
        :to="activeRoundHref"
        class="flex items-center justify-center gap-2 rounded-xl bg-mundial-green px-4 py-3.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
      >
        <Grid3x3 class="h-4 w-4" />
        {{
          baseStore.activeRound
            ? `Jugar jornada ${baseStore.activeRound.round_number}`
            : 'Ir a quiniela'
        }}
        <ChevronRight class="h-4 w-4 opacity-70" />
      </RouterLink>
    </template>

    <div
      v-else
      class="rounded-2xl border border-white/10 px-6 py-10 text-center"
    >
      <p class="text-sm font-medium">Todavía no hay partidos para mostrar</p>
      <p class="mt-1 text-xs text-app-muted">
        Cuando arranque la jornada verás el encuentro en vivo y el próximo aquí.
      </p>
      <RouterLink
        :to="JORNADAS_PATH"
        class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-mundial-accent"
      >
        Ver quiniela
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>
  </section>
</template>
