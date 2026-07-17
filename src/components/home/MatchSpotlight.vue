<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { MapPin, Radio } from '@lucide/vue'
import BroadcastBadge from '@/components/shared/BroadcastBadge.vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import MatchCardsList from '@/components/shared/MatchCardsList.vue'
import MatchGoalsList from '@/components/shared/MatchGoalsList.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import {
  formatLiveStatusLabel,
  formatScheduledStatusLabel,
  isMatchHalftime,
  isMatchInterrupted,
  LIVE_STATUS_DETAIL_LABELS,
} from '@/lib/matchClock'
import { formatKickoff } from '@/lib/matchRules'
import { formatMatchVenue } from '@/lib/matchVenue'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/types'

const props = withDefaults(
  defineProps<{
    match: Match
    isLive?: boolean
    isRecentlyFinished?: boolean
    /** Varios partidos a la misma hora (máx. 3). */
    isStellar?: boolean
    stellarIndex?: number
    stellarCount?: number
  }>(),
  {
    isLive: false,
    isRecentlyFinished: false,
    isStellar: false,
    stellarIndex: 0,
    stellarCount: 1,
  },
)

const matchStore = useMatchStore()
const router = useRouter()

function goToDetail() {
  router.push(`/partido/${props.match.id}`)
}

const interrupted = computed(() => isMatchInterrupted(props.match))
const interruptedLabel = computed(() =>
  props.match.live_status_detail
    ? LIVE_STATUS_DETAIL_LABELS[props.match.live_status_detail]
    : null,
)
const halftime = computed(() => isMatchHalftime(props.match))
const showScore = computed(
  () => props.isLive || props.isRecentlyFinished || props.match.status === 'finished',
)
const statusLabel = computed(() => {
  if (props.isLive || interrupted.value) return formatLiveStatusLabel(props.match)
  if (props.isRecentlyFinished || props.match.status === 'finished') return 'Finalizado'
  return formatScheduledStatusLabel(props.match) ?? formatKickoff(props.match) ?? 'Próximo'
})
const eyebrow = computed(() => {
  if (props.isStellar && props.stellarCount > 1) {
    if (props.isLive) return `Estelar ${props.stellarIndex + 1}/${props.stellarCount} · En vivo`
    if (props.isRecentlyFinished || props.match.status === 'finished') {
      return `Estelar ${props.stellarIndex + 1}/${props.stellarCount}`
    }
    return `Estelar ${props.stellarIndex + 1}/${props.stellarCount}`
  }
  if (props.isLive) return 'En vivo'
  if (props.isRecentlyFinished || props.match.status === 'finished') return 'Último resultado'
  return 'Próximo partido'
})

const shouldLoadEvents = computed(
  () =>
    props.isLive ||
    props.isRecentlyFinished ||
    props.match.status === 'finished',
)

const showEventDetails = computed(
  () => props.isLive || !!props.isRecentlyFinished,
)

const matchEvents = computed(() => matchStore.getEventsForMatch(props.match.id))

let eventsTimer: ReturnType<typeof setInterval> | null = null

function loadEvents() {
  if (shouldLoadEvents.value) {
    void matchStore.fetchEvents(props.match.id)
  }
}

// Countdown para el próximo partido (no en vivo, no finalizado, con fecha)
const isPending = computed(
  () => !props.isLive && props.match.status !== 'finished' && !!props.match.match_date,
)

const now = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval> | null = null

function startClock() {
  if (clockTimer) return
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
}

const countdownLabel = computed(() => {
  if (!isPending.value || !props.match.match_date) return null
  const diffMs = new Date(props.match.match_date).getTime() - now.value
  if (diffMs <= 0) return 'Comienza en instantes'

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `Comienza en ${days}d ${hours}h`
  if (hours > 0) return `Comienza en ${hours}h ${minutes}m`
  if (minutes > 0) return `Comienza en ${minutes}m ${seconds}s`
  return `Comienza en ${seconds}s`
})

watch(isPending, (pending) => {
  if (pending) startClock()
  else stopClock()
})

onMounted(() => {
  loadEvents()
  if (props.isLive) {
    eventsTimer = setInterval(loadEvents, 30_000)
  }
  if (isPending.value) {
    startClock()
  }
})

watch(shouldLoadEvents, (load) => {
  if (load) void matchStore.fetchEvents(props.match.id)
})

watch(
  () => props.isLive,
  (live) => {
    if (eventsTimer) {
      clearInterval(eventsTimer)
      eventsTimer = null
    }
    if (live) {
      eventsTimer = setInterval(loadEvents, 30_000)
      loadEvents()
    }
  },
)

onUnmounted(() => {
  if (eventsTimer) clearInterval(eventsTimer)
  stopClock()
})
</script>

<template>
  <article
    role="link"
    tabindex="0"
    class="cursor-pointer overflow-hidden rounded-2xl border theme-surface-gradient-via transition hover:border-mundial-accent/40"
    :class="
      interrupted
        ? 'border-amber-400/40 ring-1 ring-amber-400/30'
        : isLive
          ? halftime
            ? 'border-mundial-accent/45 ring-1 ring-mundial-accent/30'
            : 'border-mundial-green/40 ring-1 ring-mundial-green/25'
          : 'border-white/10'
    "
    @click="goToDetail"
    @keydown.enter.prevent="goToDetail"
    @keydown.space.prevent="goToDetail"
  >
    <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          {{ eyebrow }}
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

    <div class="px-4 py-5 sm:px-6 sm:py-6">
      <div class="flex items-center justify-between gap-3 sm:gap-6">
        <RouterLink
          v-if="match.home_team?.code"
          :to="`/tablas/equipo/${match.home_team.code}`"
          class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center hover:text-mundial-accent"
          @click.stop
        >
          <TeamFlag
            :src="match.home_team?.flag_url"
            :code="match.home_team?.code"
            :alt="teamDisplayName(match.home_team, 'Local')"
            size="lg"
            img-class="h-12 w-12 sm:h-14 sm:w-14"
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
            img-class="h-12 w-12 sm:h-14 sm:w-14"
          />
          <span class="w-full truncate text-sm font-semibold sm:text-base">
            {{ teamDisplayName(match.home_team, 'Local') }}
          </span>
        </div>

        <div class="shrink-0 text-center">
          <p
            v-if="showScore"
            class="text-3xl font-black tabular-nums tracking-tight sm:text-4xl"
          >
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
          <p
            v-if="countdownLabel"
            class="mt-0.5 text-[11px] font-semibold tabular-nums text-mundial-accent sm:text-xs"
          >
            {{ countdownLabel }}
          </p>
        </div>

        <RouterLink
          v-if="match.away_team?.code"
          :to="`/tablas/equipo/${match.away_team.code}`"
          class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center hover:text-mundial-accent"
          @click.stop
        >
          <TeamFlag
            :src="match.away_team?.flag_url"
            :code="match.away_team?.code"
            :alt="teamDisplayName(match.away_team, 'Visitante')"
            size="lg"
            img-class="h-12 w-12 sm:h-14 sm:w-14"
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
            img-class="h-12 w-12 sm:h-14 sm:w-14"
          />
          <span class="w-full truncate text-sm font-semibold sm:text-base">
            {{ teamDisplayName(match.away_team, 'Visitante') }}
          </span>
        </div>
      </div>

      <p
        v-if="match.venue || match.broadcast_channel"
        class="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-xs text-app-muted"
      >
        <span v-if="match.venue" class="inline-flex items-center gap-1">
          <MapPin class="h-3.5 w-3.5 shrink-0 opacity-70" />
          {{ formatMatchVenue(match.venue) }}
        </span>
        <BroadcastBadge v-if="match.broadcast_channel" :channels="match.broadcast_channel" :max="3" size="md" />
      </p>
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

    <MatchGoalsList
      v-if="showEventDetails"
      :match="match"
      :events="matchEvents"
    />
    <MatchCardsList
      v-if="showEventDetails"
      :match="match"
      :events="matchEvents"
    />
  </article>
</template>
