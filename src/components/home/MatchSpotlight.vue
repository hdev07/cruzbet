<script setup lang="ts">
import { computed } from 'vue'
import { Radio } from '@lucide/vue'
import LiveMatchPulse from '@/components/shared/LiveMatchPulse.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import {
  formatLiveStatusLabel,
  formatScheduledStatusLabel,
  isMatchDelayed,
} from '@/lib/matchClock'
import { formatKickoff } from '@/lib/matchRules'
import { teamDisplayName } from '@/lib/teamDisplay'
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

const delayed = computed(() => isMatchDelayed(props.match))
const showScore = computed(
  () => props.isLive || props.isRecentlyFinished || props.match.status === 'finished',
)
const statusLabel = computed(() => {
  if (props.isLive) return formatLiveStatusLabel(props.match)
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
</script>

<template>
  <article
    class="overflow-hidden rounded-2xl border theme-surface-gradient-via"
    :class="
      isLive
        ? delayed
          ? 'border-amber-400/40 ring-1 ring-amber-400/30'
          : 'border-mundial-green/40 ring-1 ring-mundial-green/25'
        : 'border-white/10'
    "
  >
    <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          {{ eyebrow }}
        </p>
        <p
          class="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold"
          :class="isLive ? (delayed ? 'text-amber-400' : 'text-mundial-green') : 'text-app-muted'"
        >
          <Radio v-if="isLive" class="h-3.5 w-3.5" />
          {{ statusLabel }}
        </p>
      </div>
      <p v-if="match.phase" class="text-xs text-app-muted">
        {{ match.phase }}
      </p>
    </div>

    <div class="px-4 py-5 sm:px-6 sm:py-6">
      <div class="flex items-center justify-between gap-3 sm:gap-6">
        <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
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
          <LiveMatchPulse v-if="isLive" class="live-pulse-under-score" />
          <p
            v-if="!isLive && match.match_date"
            class="mt-1 text-[11px] text-app-muted sm:text-xs"
          >
            {{ formatKickoff(match) }}
          </p>
        </div>

        <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
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

      <p v-if="match.venue" class="mt-3 text-center text-xs text-app-muted">
        {{ match.venue }}
      </p>
    </div>
  </article>
</template>
