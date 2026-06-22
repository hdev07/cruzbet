<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { ChevronRight, Radio, Users } from '@lucide/vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import MatchCardsList from '@/components/shared/MatchCardsList.vue'
import MatchGoalsList from '@/components/shared/MatchGoalsList.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { bracketParticipantLabel } from '@/lib/knockoutBracket'
import { isEffectivelyLive, isRecentlyFinished } from '@/lib/matchLifecycle'
import { phaseLabel } from '@/lib/matchPhases'
import { teamDisplayName } from '@/lib/teamDisplay'
import { formatLiveStatusLabel, formatScheduledStatusLabel, isMatchDelayed } from '@/lib/matchClock'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/types'

const props = withDefaults(
  defineProps<{
    match: Match
    showPredictBadge?: boolean
    participantCount?: number
    linkable?: boolean
  }>(),
  { linkable: true },
)

const matchStore = useMatchStore()

const isLive = computed(() => isEffectivelyLive(props.match))
const isDelayed = computed(() => isMatchDelayed(props.match))
const showEventDetails = computed(
  () => isLive.value || isRecentlyFinished(props.match),
)
const matchEvents = computed(() => matchStore.getEventsForMatch(props.match.id))

onMounted(() => {
  if (showEventDetails.value) void matchStore.fetchEvents(props.match.id)
})

watch(showEventDetails, (show) => {
  if (show) void matchStore.fetchEvents(props.match.id)
})

function homeLabel(match: Match) {
  if (match.home_team) return teamDisplayName(match.home_team, 'Local')
  return bracketParticipantLabel(match, 'home')
}

function awayLabel(match: Match) {
  if (match.away_team) return teamDisplayName(match.away_team, 'Visitante')
  return bracketParticipantLabel(match, 'away')
}
</script>

<template>
  <component
    :is="linkable ? 'RouterLink' : 'div'"
    :to="linkable ? `/match/${match.id}` : undefined"
    class="block overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 lg:p-5"
    :class="[
      linkable ? 'transition hover:border-mundial-accent/50 hover:bg-white/10' : '',
      {
        'ring-2 ring-mundial-green/60': isLive && !isDelayed,
        'ring-2 ring-amber-400/60': isLive && isDelayed,
      },
    ]"
  >
    <div class="mb-2 flex items-center justify-between text-xs text-slate-400">
      <span>{{ phaseLabel(match.phase) }}</span>
      <span
        v-if="isLive"
        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-white"
        :class="isDelayed ? 'bg-amber-500' : 'bg-mundial-green'"
      >
        <Radio class="h-3 w-3" />
        {{ formatLiveStatusLabel(match) }}
      </span>
      <span v-else-if="match.status === 'finished'">Finalizado</span>
      <span
        v-else-if="formatScheduledStatusLabel(match)"
        class="font-semibold text-amber-400"
      >
        {{ formatScheduledStatusLabel(match) }}
      </span>
      <span v-else class="text-slate-500">
        {{ match.match_date ? new Date(match.match_date).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Por definir' }}
      </span>
    </div>

    <div class="flex items-center justify-between gap-2 sm:gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <TeamFlag
          v-if="match.home_team?.flag_url"
          :src="match.home_team.flag_url"
          :alt="teamDisplayName(match.home_team, 'Local')"
          img-class="h-6 w-8 shrink-0 object-cover"
        />
        <span class="truncate font-medium">{{ homeLabel(match) }}</span>
      </div>

      <div class="shrink-0 px-1 text-center">
        <p class="text-lg font-bold tabular-nums sm:text-xl">
          <template v-if="match.status !== 'scheduled'">
            {{ match.home_score }} - {{ match.away_score }}
          </template>
          <template v-else>vs</template>
        </p>
        <LiveMatchPulse v-if="isLive" compact class="live-pulse-under-score live-pulse-under-score--compact" />
      </div>

      <div class="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span class="truncate font-medium">{{ awayLabel(match) }}</span>
        <TeamFlag
          v-if="match.away_team?.flag_url"
          :src="match.away_team.flag_url"
          :alt="teamDisplayName(match.away_team, 'Visitante')"
          img-class="h-6 w-8 shrink-0 object-cover"
        />
      </div>
    </div>

    <p v-if="match.venue" class="mt-2 text-center text-xs text-slate-500">
      {{ match.venue }}
    </p>

    <p
      v-if="participantCount"
      class="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400"
    >
      <Users class="h-3.5 w-3.5 shrink-0" />
      {{ participantCount }} {{ participantCount === 1 ? 'participante' : 'participantes' }}
    </p>

    <div v-if="showPredictBadge" class="mt-3 text-center">
      <span class="inline-flex items-center gap-1 rounded-lg bg-mundial-accent/20 px-3 py-1 text-xs font-semibold text-mundial-accent">
        Predecir
        <ChevronRight class="h-3.5 w-3.5" />
      </span>
    </div>

    <MatchGoalsList
      v-if="showEventDetails"
      :match="match"
      :events="matchEvents"
      compact
      :max-items="4"
      class="-mx-4 mt-3 lg:-mx-5"
    />
    <MatchCardsList
      v-if="showEventDetails"
      :match="match"
      :events="matchEvents"
      compact
      :max-items="4"
      class="-mx-4 lg:-mx-5"
    />
  </component>
</template>
