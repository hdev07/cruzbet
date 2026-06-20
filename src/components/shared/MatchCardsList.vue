<script setup lang="ts">
import { computed } from 'vue'
import { cardsForMatch, formatCardLine, normalizeCardType } from '@/lib/cardDisplay'
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

const cards = computed(() => cardsForMatch(props.events, props.match.id))

const visibleCards = computed(() =>
  props.maxItems > 0 ? cards.value.slice(-props.maxItems) : cards.value,
)

function isHomeCard(event: MatchEvent): boolean {
  return event.team_id === props.match.home_team_id
}

function cardIconClass(event: MatchEvent): string {
  return normalizeCardType(event.metadata?.card_type) === 'red'
    ? 'bg-red-500'
    : 'bg-amber-400'
}
</script>

<template>
  <div v-if="visibleCards.length" class="border-t border-white/10">
    <p
      class="font-semibold uppercase tracking-wide text-slate-500"
      :class="compact ? 'px-3 py-1.5 text-[0.6rem]' : 'px-4 py-2 text-[0.65rem] sm:px-5'"
    >
      Tarjetas
    </p>
    <ul
      :class="compact ? 'space-y-1 px-3 pb-2' : 'space-y-1.5 px-4 pb-3 sm:px-5'"
    >
      <li
        v-for="event in visibleCards"
        :key="event.id"
        class="flex items-start gap-2 text-[0.7rem] leading-snug sm:text-xs"
        :class="isHomeCard(event) ? 'flex-row' : 'flex-row-reverse text-right'"
      >
        <span
          class="mt-1 h-3 w-2 shrink-0 rounded-sm"
          :class="cardIconClass(event)"
        />
        <TeamFlag
          v-if="isHomeCard(event) ? match.home_team?.flag_url : match.away_team?.flag_url"
          :src="isHomeCard(event) ? match.home_team?.flag_url : match.away_team?.flag_url"
          :alt="isHomeCard(event) ? 'Local' : 'Visitante'"
          img-class="mt-0.5 h-3 w-4 shrink-0 object-cover"
        />
        <span class="min-w-0 text-slate-300">
          {{ formatCardLine(event, match) }}
        </span>
      </li>
    </ul>
  </div>
</template>
