<script setup lang="ts">
import { computed } from 'vue'
import { Radio } from '@lucide/vue'
import BroadcastBadge from '@/components/shared/BroadcastBadge.vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { formatMatchVenue } from '@/lib/matchVenue'
import {
  formatLiveStatusLabel,
  formatScheduledStatusLabel,
  isMatchHalftime,
  isMatchInterrupted,
  LIVE_STATUS_DETAIL_LABELS,
} from '@/lib/matchClock'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { teamDisplayName } from '@/lib/teamDisplay'
import { formatMatchDate, formatMatchTime } from '@/lib/weekendCalendar'
import type { Match } from '@/types'

const props = defineProps<{
  match: Match
}>()

const isLive = computed(() => isEffectivelyLive(props.match))
const halftime = computed(() => isMatchHalftime(props.match))
const interrupted = computed(() => isMatchInterrupted(props.match))
const isFinished = computed(() => props.match.status === 'finished')
const showScore = computed(() => isLive.value || isFinished.value)

const statusText = computed(() => {
  if (isLive.value || interrupted.value) return formatLiveStatusLabel(props.match)
  if (isFinished.value) return 'Final'
  return formatScheduledStatusLabel(props.match)
})
const interruptedShort = computed(() => {
  const detail = props.match.live_status_detail
  if (!detail) return null
  return LIVE_STATUS_DETAIL_LABELS[detail].slice(0, 3)
})
const venueLabel = computed(() => formatMatchVenue(props.match.venue))
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border px-3 py-2.5"
    :class="
      isLive
        ? 'border-mundial-green/35 bg-mundial-green/10'
        : isFinished
          ? 'border-white/8 bg-white/[0.03] opacity-90'
          : 'border-white/10 bg-white/5'
    "
  >
    <div class="w-14 shrink-0 text-center">
      <p
        class="text-[10px] font-semibold uppercase leading-none text-app-muted"
      >
        {{ formatMatchDate(match) }}
      </p>
      <p
        class="mt-1 text-xs font-semibold tabular-nums"
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
        <template v-if="halftime">HT</template>
        <template v-else-if="interruptedShort">{{ interruptedShort }}</template>
        <template v-else-if="isLive">
          <span class="inline-flex items-center justify-center gap-0.5">
            <Radio class="h-3 w-3" />
          </span>
        </template>
        <template v-else>
          {{ isFinished ? 'FT' : formatMatchTime(match) }}
        </template>
      </p>
    </div>

    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex items-center gap-2">
        <TeamFlag
          :src="match.home_team?.flag_url"
          :code="match.home_team?.code"
          :alt="teamDisplayName(match.home_team, 'Local')"
          size="sm"
        />
        <span class="min-w-0 flex-1 truncate text-sm font-medium">
          {{ teamDisplayName(match.home_team, 'Local') }}
        </span>
        <span
          v-if="showScore"
          class="w-5 text-right text-sm font-bold tabular-nums"
        >
          {{ match.home_score }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <TeamFlag
          :src="match.away_team?.flag_url"
          :code="match.away_team?.code"
          :alt="teamDisplayName(match.away_team, 'Visitante')"
          size="sm"
        />
        <span class="min-w-0 flex-1 truncate text-sm font-medium">
          {{ teamDisplayName(match.away_team, 'Visitante') }}
        </span>
        <span
          v-if="showScore"
          class="w-5 text-right text-sm font-bold tabular-nums"
        >
          {{ match.away_score }}
        </span>
      </div>
      <LiveMatchPulse v-if="isLive && !halftime && !interrupted" compact class="live-pulse-under-score live-pulse-under-score--compact !mx-0 !mt-1 !w-16" />
      <p v-if="venueLabel || match.broadcast_channel" class="flex items-center gap-1 truncate text-[11px] text-app-muted sm:hidden">
        <BroadcastBadge :channels="match.broadcast_channel" :max="1" />
        <span class="truncate">{{ venueLabel }}</span>
      </p>
    </div>

    <div class="hidden w-36 shrink-0 text-right sm:block">
      <p
        v-if="statusText"
        class="text-[11px] font-medium"
        :class="
          interrupted
            ? 'text-amber-400'
            : isLive
              ? 'text-mundial-green'
              : 'text-app-muted'
        "
      >
        {{ statusText }}
      </p>
      <p v-if="venueLabel || match.broadcast_channel" class="mt-0.5 flex items-center justify-end gap-1 truncate text-[11px] text-app-muted">
        <span class="truncate" :title="venueLabel">{{ venueLabel }}</span>
        <BroadcastBadge :channels="match.broadcast_channel" :max="2" />
      </p>
    </div>
  </div>
</template>
