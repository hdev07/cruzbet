<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { MapPin, Radio } from '@lucide/vue'
import BroadcastBadge from '@/components/shared/BroadcastBadge.vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { formatMatchVenue } from '@/lib/matchVenue'
import {
  formatLiveStatusLabel,
  formatScheduledStatusLabel,
  isMatchHalftime,
  isMatchInterrupted,
} from '@/lib/matchClock'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { teamDisplayName } from '@/lib/teamDisplay'
import { formatMatchDate, formatMatchTime } from '@/lib/weekendCalendar'
import type { Match } from '@/types'

const props = defineProps<{
  match: Match
}>()

const router = useRouter()

function goToDetail() {
  router.push(`/partido/${props.match.id}`)
}

const isLive = computed(() => isEffectivelyLive(props.match))
const halftime = computed(() => isMatchHalftime(props.match))
const interrupted = computed(() => isMatchInterrupted(props.match))
const isFinished = computed(() => props.match.status === 'finished')
const showScore = computed(() => isLive.value || isFinished.value)

const headlineStatus = computed(() => {
  if (isLive.value || interrupted.value) return formatLiveStatusLabel(props.match)
  if (isFinished.value) return 'Final'
  return formatScheduledStatusLabel(props.match) ?? formatMatchTime(props.match)
})
const statusColorClass = computed(() => {
  if (interrupted.value) return 'text-amber-400'
  if (isLive.value) return halftime.value ? 'text-mundial-accent' : 'text-mundial-green'
  return 'text-app-muted'
})
const venueLabel = computed(() => formatMatchVenue(props.match.venue))
const hasMeta = computed(
  () => Boolean(venueLabel.value || props.match.broadcast_channel),
)
</script>

<template>
  <div
    role="link"
    tabindex="0"
    class="cursor-pointer rounded-xl border px-3 py-2.5 transition hover:border-mundial-accent/40"
    :class="
      isLive
        ? 'border-mundial-green/35 bg-mundial-green/10'
        : isFinished
          ? 'border-white/8 bg-white/3 opacity-90'
          : 'border-white/10 bg-white/5'
    "
    @click="goToDetail"
    @keydown.enter.prevent="goToDetail"
    @keydown.space.prevent="goToDetail"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-app-muted">
        {{ formatMatchDate(match) }}<template v-if="match.phase"> · {{ match.phase }}</template>
      </span>
      <span
        class="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums"
        :class="statusColorClass"
      >
        <Radio v-if="isLive && !halftime && !interrupted" class="h-3 w-3" />
        {{ headlineStatus }}
      </span>
    </div>

    <div class="mt-2 space-y-1.5">
      <div class="flex items-center gap-2">
        <RouterLink
          v-if="match.home_team?.code"
          :to="`/tablas/equipo/${match.home_team.code}`"
          class="flex min-w-0 flex-1 items-center gap-2 hover:text-mundial-accent"
          @click.stop
        >
          <TeamFlag
            :src="match.home_team?.flag_url"
            :code="match.home_team?.code"
            :alt="teamDisplayName(match.home_team, 'Local')"
            size="sm"
          />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ teamDisplayName(match.home_team, 'Local') }}
          </span>
        </RouterLink>
        <template v-else>
          <TeamFlag
            :src="match.home_team?.flag_url"
            :code="match.home_team?.code"
            :alt="teamDisplayName(match.home_team, 'Local')"
            size="sm"
          />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ teamDisplayName(match.home_team, 'Local') }}
          </span>
        </template>
        <span
          v-if="showScore"
          class="w-5 text-right text-sm font-bold tabular-nums"
        >
          {{ match.home_score }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink
          v-if="match.away_team?.code"
          :to="`/tablas/equipo/${match.away_team.code}`"
          class="flex min-w-0 flex-1 items-center gap-2 hover:text-mundial-accent"
          @click.stop
        >
          <TeamFlag
            :src="match.away_team?.flag_url"
            :code="match.away_team?.code"
            :alt="teamDisplayName(match.away_team, 'Visitante')"
            size="sm"
          />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ teamDisplayName(match.away_team, 'Visitante') }}
          </span>
        </RouterLink>
        <template v-else>
          <TeamFlag
            :src="match.away_team?.flag_url"
            :code="match.away_team?.code"
            :alt="teamDisplayName(match.away_team, 'Visitante')"
            size="sm"
          />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ teamDisplayName(match.away_team, 'Visitante') }}
          </span>
        </template>
        <span
          v-if="showScore"
          class="w-5 text-right text-sm font-bold tabular-nums"
        >
          {{ match.away_score }}
        </span>
      </div>
      <LiveMatchPulse
        v-if="isLive && !halftime && !interrupted"
        compact
        class="mx-0! mt-1.5! w-full!"
      />
    </div>

    <div
      v-if="hasMeta"
      class="mt-2 flex flex-col items-start gap-1 border-t border-white/5 pt-2"
    >
      <span
        v-if="venueLabel"
        class="flex min-w-0 items-center gap-1 text-[11px] text-app-muted"
        :title="venueLabel"
      >
        <MapPin class="h-3 w-3 shrink-0 opacity-70" />
        <span class="min-w-0 truncate">{{ venueLabel }}</span>
      </span>
      <BroadcastBadge
        v-if="match.broadcast_channel"
        :channels="match.broadcast_channel"
        :max="3"
        class="mt-1"
      />
    </div>
  </div>
</template>
