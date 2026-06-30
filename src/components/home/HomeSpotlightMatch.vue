<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Clock, Radio, Trophy } from '@lucide/vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import MatchCardsList from '@/components/shared/MatchCardsList.vue'
import MatchGoalsList from '@/components/shared/MatchGoalsList.vue'
import MatchScoreDisplay from '@/components/shared/MatchScoreDisplay.vue'
import { formatLiveStatusLabel, isMatchDelayed } from '@/lib/matchClock'
import { formatKickoff } from '@/lib/matchRules'
import { phaseLabel } from '@/lib/matchPhases'
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/types'

const props = defineProps<{
  match: Match
  isLive: boolean
  isRecentlyFinished?: boolean
}>()

const matchStore = useMatchStore()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const shouldLoadEvents = computed(
  () =>
    props.isLive ||
    props.isRecentlyFinished ||
    props.match.status === 'finished',
)

onMounted(() => {
  if (shouldLoadEvents.value) {
    void matchStore.fetchEvents(props.match.id)
  }
  const intervalMs =
    props.match.match_date && !props.isLive ? 1_000 : 30_000
  timer = setInterval(() => {
    now.value = Date.now()
  }, intervalMs)
})

watch(shouldLoadEvents, (load) => {
  if (load) void matchStore.fetchEvents(props.match.id)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const matchEvents = computed(() => matchStore.getEventsForMatch(props.match.id))

const showEventDetails = computed(
  () => props.isLive || !!props.isRecentlyFinished,
)

const kickoffLabel = computed(() => formatKickoff(props.match))

const isDelayed = computed(() => isMatchDelayed(props.match))

const countdown = computed(() => {
  if (!props.match.match_date || props.isLive) return null
  const diff = new Date(props.match.match_date).getTime() - now.value
  if (diff <= 0) return 'Por comenzar'
  const hours = Math.floor(diff / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (hours >= 48) {
    const days = Math.floor(hours / 24)
    return `Faltan ${days} ${days === 1 ? 'día' : 'días'}`
  }
  if (hours > 0) return `Faltan ${hours}h ${mins}m`
  const secs = Math.floor((diff % 60_000) / 1_000)
  if (mins > 0) return `Faltan ${mins}m ${secs}s`
  return `Faltan ${secs}s`
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border-2"
    :class="
      isLive
        ? isDelayed
          ? 'border-amber-400/60 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent ring-1 ring-amber-400/30'
          : 'border-mundial-green/60 bg-gradient-to-br from-mundial-green/20 via-mundial-green/5 to-transparent ring-1 ring-mundial-green/30'
        : 'border-white/15 theme-spotlight-idle'
    "
  >
    <div class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 sm:px-5">
      <div class="flex items-center gap-2">
        <span
          v-if="isLive"
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          :class="isDelayed ? 'bg-amber-500' : 'bg-mundial-green'"
        >
          <Radio class="h-3 w-3" />
          {{ formatLiveStatusLabel(match) }}
        </span>
        <span
          v-else-if="isRecentlyFinished"
          class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300"
        >
          <Trophy class="h-3 w-3" />
          Finalizado
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300"
        >
          <Clock class="h-3 w-3" />
          Próximo partido
        </span>
        <span class="hidden text-xs text-slate-500 sm:inline">
          {{ phaseLabel(match.phase) }}
        </span>
      </div>
      <span v-if="countdown" class="text-xs font-medium tabular-nums text-slate-400">
        {{ countdown }}
      </span>
    </div>

    <div class="px-4 py-5 sm:px-6 sm:py-6">
      <div class="flex items-center justify-between gap-3 sm:gap-6">
        <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag
            v-if="match.home_team?.flag_url"
            :src="match.home_team.flag_url"
            :alt="teamDisplayName(match.home_team, 'Local')"
            img-class="h-12 w-16 object-cover shadow-md sm:h-14 sm:w-20"
          />
          <span class="w-full truncate text-sm font-semibold sm:text-base">
            {{ teamDisplayName(match.home_team, 'Local') }}
          </span>
        </div>

        <div class="shrink-0 text-center">
          <MatchScoreDisplay
            v-if="isLive || isRecentlyFinished || match.status === 'finished'"
            :match="match"
            size="lg"
          />
          <p v-else class="text-2xl font-bold text-slate-500 sm:text-3xl">VS</p>
          <LiveMatchPulse v-if="isLive" class="live-pulse-under-score" />
          <p v-if="kickoffLabel && !isLive" class="mt-1 text-[11px] text-slate-500 sm:text-xs">
            {{ kickoffLabel }}
          </p>
        </div>

        <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag
            v-if="match.away_team?.flag_url"
            :src="match.away_team.flag_url"
            :alt="teamDisplayName(match.away_team, 'Visitante')"
            img-class="h-12 w-16 object-cover shadow-md sm:h-14 sm:w-20"
          />
          <span class="w-full truncate text-sm font-semibold sm:text-base">
            {{ teamDisplayName(match.away_team, 'Visitante') }}
          </span>
        </div>
      </div>

      <p v-if="match.venue" class="mt-3 text-center text-xs text-slate-500">
        {{ match.venue }}
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
  </div>
</template>
