<script setup lang="ts">
import { computed } from 'vue'
import { formatGoalLine, goalsForMatch } from '@/lib/goalDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { Match, MatchEvent } from '@/types'

const props = withDefaults(
  defineProps<{
    match: Match
    events: MatchEvent[]
    compact?: boolean
    maxItems?: number
  }>(),
  { compact: false, maxItems: 6 },
)

const goals = computed(() => goalsForMatch(props.events, props.match.id))

const visibleGoals = computed(() =>
  props.maxItems > 0 ? goals.value.slice(-props.maxItems) : goals.value,
)

function isHomeGoal(event: MatchEvent): boolean {
  return event.team_id === props.match.home_team_id
}
</script>

<template>
  <div v-if="visibleGoals.length" class="border-t border-white/10">
    <p
      class="font-semibold uppercase tracking-wide text-app-muted"
      :class="compact ? 'px-3 py-1.5 text-[0.6rem]' : 'px-4 py-2 text-[0.65rem] sm:px-5'"
    >
      Goles
    </p>
    <ul
      :class="compact ? 'space-y-1 px-3 pb-2' : 'space-y-1.5 px-4 pb-3 sm:px-5'"
    >
      <li
        v-for="event in visibleGoals"
        :key="event.id"
        class="flex items-start gap-2 text-[0.7rem] leading-snug sm:text-xs"
        :class="isHomeGoal(event) ? 'flex-row' : 'flex-row-reverse text-right'"
      >
        <TeamFlag
          :src="isHomeGoal(event) ? match.home_team?.flag_url : match.away_team?.flag_url"
          :code="isHomeGoal(event) ? match.home_team?.code : match.away_team?.code"
          :alt="isHomeGoal(event) ? 'Local' : 'Visitante'"
          size="sm"
          img-class="mt-0.5 !h-3.5 !w-3.5"
        />
        <span class="min-w-0 text-app-text/80">
          {{ formatGoalLine(event, match) }}
        </span>
      </li>
    </ul>
  </div>
</template>
