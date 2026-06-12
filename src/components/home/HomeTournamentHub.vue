<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, ChevronRight, Goal, LayoutGrid, Radio, Trophy, Zap } from '@lucide/vue'
import GroupStandingsMiniCard from '@/components/home/GroupStandingsMiniCard.vue'
import HomeSpotlightMatch from '@/components/home/HomeSpotlightMatch.vue'
import GroupStandingsTable from '@/components/shared/GroupStandingsTable.vue'
import MatchCard from '@/components/shared/MatchCard.vue'
import { useHomeRealtime } from '@/composables/useHomeRealtime'
import { totalGoalsInMatches } from '@/lib/groupStandings'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import { supabase } from '@/lib/supabase'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStandingsStore } from '@/stores/groupStandingsStore'
import { useMatchStore } from '@/stores/matchStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

const auth = useAuthStore()
const matchStore = useMatchStore()
const standingsStore = useGroupStandingsStore()
const { participantCounts } = useHomeRealtime()

let channel: RealtimeChannel | null = null

onMounted(async () => {
  await Promise.all([
    standingsStore.fetchStandingsData(),
    matchStore.matches.length
      ? Promise.resolve()
      : Promise.all([matchStore.fetchMatches(), matchStore.fetchLiveMatches()]),
    auth.user ? auth.fetchProfile(auth.user.id) : Promise.resolve(),
  ])

  channel = supabase
    .channel('home-tournament-hub')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
      await Promise.all([matchStore.fetchMatches(), matchStore.fetchLiveMatches()])
      standingsStore.refreshFromMatches(matchStore.matches)
    })
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})

watch(
  () => matchStore.matches,
  (matches) => {
    if (matches.length) standingsStore.refreshFromMatches(matches)
  },
)

const liveMatches = computed(() => matchStore.liveMatches)

const nextScheduledMatch = computed(() =>
  matchStore.matches
    .filter((m) => m.status !== 'finished' && !isEffectivelyLive(m) && m.match_date)
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())[0] ?? null,
)

const spotlightMatch = computed(() => liveMatches.value[0] ?? nextScheduledMatch.value)

const spotlightIsLive = computed(
  () => !!spotlightMatch.value && isEffectivelyLive(spotlightMatch.value),
)

const otherLiveMatches = computed(() =>
  liveMatches.value.filter((m) => m.id !== spotlightMatch.value?.id),
)

const upcomingMatches = computed(() =>
  matchStore.matches
    .filter(
      (m) =>
        m.id !== spotlightMatch.value?.id &&
        isMatchOpenForPredictions(m) &&
        m.match_date,
    )
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())
    .slice(0, 3),
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
    value: standingsStore.groupMatches.length,
    icon: Calendar,
    accent: false,
  },
  {
    label: 'Goles',
    value: totalGoals.value,
    icon: Goal,
    accent: false,
  },
  {
    label: 'Tus puntos',
    value: auth.isLoggedIn ? (auth.profile?.points ?? 0) : '—',
    icon: Trophy,
    accent: !!auth.isLoggedIn,
  },
])
</script>

<template>
  <section
    class="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent"
  >
    <div class="border-b border-white/10 px-4 py-5 sm:px-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
            Centro del torneo
          </p>
          <h2 class="text-xl font-bold text-slate-100 sm:text-2xl">Mundial 2026</h2>
          <p class="mt-1 text-sm text-slate-400">
            Tablas, partidos en vivo y lo que viene — todo en un solo lugar
          </p>
        </div>
        <RouterLink
          to="/quiniela-partido/grupos"
          class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-mundial-accent/40 hover:text-mundial-accent"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
          Ver 12 grupos
        </RouterLink>
      </div>

      <div v-if="spotlightMatch" class="mt-4">
        <HomeSpotlightMatch
          :match="spotlightMatch"
          :is-live="spotlightIsLive"
          :participant-count="participantCounts[spotlightMatch.id] ?? 0"
        />

        <div
          v-if="otherLiveMatches.length"
          class="mt-2 flex gap-2 overflow-x-auto pb-1 app-scrollbar"
        >
          <RouterLink
            v-for="match in otherLiveMatches"
            :key="match.id"
            :to="`/match/${match.id}`"
            class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-mundial-green/30 bg-mundial-green/10 px-3 py-1.5 text-xs font-medium text-mundial-green transition hover:bg-mundial-green/20"
          >
            <Radio class="h-3 w-3" />
            {{ teamDisplayName(match.home_team, 'Local') }}
            {{ match.home_score }}-{{ match.away_score }}
            {{ teamDisplayName(match.away_team, 'Visit.') }}
          </RouterLink>
        </div>
      </div>

      <div
        v-else
        class="mt-4 rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-slate-400"
      >
        No hay partidos programados por ahora.
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            Toca un grupo para ver la clasificación completa
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
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Próximos partidos
        </h3>
        <RouterLink
          to="/quiniela-partido"
          class="inline-flex items-center gap-1 text-xs font-semibold text-mundial-accent hover:underline"
        >
          Predecir
          <ChevronRight class="h-3.5 w-3.5" />
        </RouterLink>
      </div>

      <div
        v-if="!upcomingMatches.length"
        class="rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-slate-400"
      >
        No hay partidos abiertos para predecir ahora.
      </div>

      <div v-else class="space-y-3">
        <MatchCard
          v-for="match in upcomingMatches"
          :key="match.id"
          :match="match"
          :participant-count="participantCounts[match.id] ?? 0"
          show-predict-badge
        />
      </div>

      <div class="mt-5 flex flex-col gap-2 sm:flex-row">
        <RouterLink
          to="/quiniela-partido"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mundial-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-mundial-accent/90"
        >
          <Zap class="h-4 w-4" />
          Ir a predecir partidos
        </RouterLink>
        <RouterLink
          to="/quiniela-partido/grupos"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <LayoutGrid class="h-4 w-4" />
          Explorar todos los grupos
        </RouterLink>
      </div>
    </div>
  </section>
</template>
