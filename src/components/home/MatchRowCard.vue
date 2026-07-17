<script setup lang="ts">
import { computed } from 'vue'
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
const hasMeta = computed(
  () => Boolean(venueLabel.value || props.match.broadcast_channel),
)
</script>

<template>
  <div
    class="rounded-xl border px-3 py-2.5"
    :class="
      isLive
        ? 'border-mundial-green/35 bg-mundial-green/10'
        : isFinished
          ? 'border-white/8 bg-white/3 opacity-90'
          : 'border-white/10 bg-white/5'
    "
  >
    <div class="flex items-center gap-3">
      <div class="w-14 shrink-0 text-center">
        <p class="text-[10px] font-semibold uppercase leading-none text-app-muted">
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
        <LiveMatchPulse
          v-if="isLive && !halftime && !interrupted"
          compact
          class="live-pulse-under-score live-pulse-under-score--compact mx-0! mt-1! w-16!"
        />
      </div>

      <p
        v-if="statusText"
        class="hidden w-16 shrink-0 text-right text-[11px] font-medium sm:block"
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
    </div>

    <div
      v-if="hasMeta"
      class="mt-2 flex items-center justify-between gap-3 border-t border-white/5 pt-2 pl-15"
    >
      <span
        v-if="venueLabel"
        class="flex min-w-0 items-center gap-1 text-[11px] text-app-muted"
        :title="venueLabel"
      >
        <MapPin class="h-3 w-3 shrink-0 opacity-70" />
        <span class="min-w-0 truncate">{{ venueLabel }}</span>
      </span>
      <span v-else class="flex-1" />
      <BroadcastBadge v-if="match.broadcast_channel" :channels="match.broadcast_channel" :max="3" />
    </div>
  </div>
</template>
