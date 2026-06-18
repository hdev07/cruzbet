<script setup lang="ts">
import { computed } from 'vue'
import {
  buildMatchContext,
  formResultLabel,
  formResultTitle,
  formatTeamLastMatch,
  type TeamMatchContext,
} from '@/lib/matchContext'
import { phaseLabel } from '@/lib/matchPhases'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/types'

const props = defineProps<{
  match: Match
  compact?: boolean
}>()

const matchStore = useMatchStore()

const context = computed(() => buildMatchContext(props.match, matchStore.matches))

const homeContext = computed(() => context.value?.home)
const awayContext = computed(() => context.value?.away)
const lastHeadToHead = computed(() => context.value?.headToHead?.recent[0] ?? null)

const hasAnyHistory = computed(() => {
  const ctx = context.value
  if (!ctx) return false
  return ctx.home.played > 0 || ctx.away.played > 0 || !!ctx.headToHead
})

function teamSummary(team: TeamMatchContext): string {
  if (!team.played) return 'Sin partidos previos'

  const parts = [`${team.won}G-${team.drawn}E-${team.lost}P`, `${team.points} pts`]
  if (team.groupPosition && team.groupName) {
    parts.unshift(`${team.groupPosition}° Gr. ${team.groupName}`)
  }
  return parts.join(' · ')
}

function formBadgeClass(result: 'W' | 'D' | 'L'): string {
  if (result === 'W') return 'bg-mundial-green/20 text-mundial-green'
  if (result === 'D') return 'bg-amber-500/15 text-amber-300'
  return 'bg-red-500/15 text-red-300'
}

function headToHeadScoreLabel(entry: { match: Match; homeScore: number; awayScore: number }): string {
  const homeCode = entry.match.home_team?.code ?? teamDisplayName(entry.match.home_team, 'L').slice(0, 3)
  const awayCode = entry.match.away_team?.code ?? teamDisplayName(entry.match.away_team, 'V').slice(0, 3)
  return `${homeCode} ${entry.homeScore}-${entry.awayScore} ${awayCode}`
}
</script>

<template>
  <div
    v-if="hasAnyHistory"
    class="rounded-lg border border-white/5 bg-black/20"
    :class="compact ? 'px-2 py-1.5' : 'px-2.5 py-2'"
  >
    <div
      v-if="match.phase || match.venue"
      class="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.65rem] text-slate-500"
    >
      <span v-if="match.phase">{{ phaseLabel(match.phase) }}</span>
      <span v-if="match.phase && match.venue">·</span>
      <span v-if="match.venue" class="truncate">{{ match.venue }}</span>
    </div>

    <div class="grid grid-cols-2 gap-2">
    <div class="min-w-0">
      <p class="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
        {{ teamDisplayName(match.home_team, 'Local') }}
      </p>
      <div v-if="homeContext?.form.length" class="mt-1 flex flex-wrap gap-0.5">
        <span
          v-for="(result, index) in homeContext.form"
          :key="`home-form-${index}`"
          class="inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[0.6rem] font-bold"
          :class="formBadgeClass(result)"
          :title="formResultTitle(result)"
        >
          {{ formResultLabel(result) }}
        </span>
      </div>
      <p v-if="homeContext" class="mt-1 text-[0.65rem] leading-snug text-slate-400">
        {{ teamSummary(homeContext) }}
      </p>
      <p
        v-if="homeContext?.lastMatch"
        class="mt-0.5 text-[0.65rem] tabular-nums text-slate-300"
      >
        <span class="text-slate-500">Último:</span>
        {{ formatTeamLastMatch(homeContext.lastMatch) }}
      </p>
    </div>

    <div class="min-w-0 text-right">
      <p class="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
        {{ teamDisplayName(match.away_team, 'Visitante') }}
      </p>
      <div v-if="awayContext?.form.length" class="mt-1 flex flex-wrap justify-end gap-0.5">
        <span
          v-for="(result, index) in awayContext.form"
          :key="`away-form-${index}`"
          class="inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[0.6rem] font-bold"
          :class="formBadgeClass(result)"
          :title="formResultTitle(result)"
        >
          {{ formResultLabel(result) }}
        </span>
      </div>
      <p v-if="awayContext" class="mt-1 text-[0.65rem] leading-snug text-slate-400">
        {{ teamSummary(awayContext) }}
      </p>
      <p
        v-if="awayContext?.lastMatch"
        class="mt-0.5 text-[0.65rem] tabular-nums text-slate-300"
      >
        <span class="text-slate-500">Último:</span>
        {{ formatTeamLastMatch(awayContext.lastMatch) }}
      </p>
    </div>
    </div>

    <div
      v-if="context?.headToHead"
      class="mt-2 border-t border-white/5 pt-2 text-[0.65rem] text-slate-400"
    >
      <p>
        <span class="font-semibold text-slate-300">H2H:</span>
        {{ context.headToHead.homeWins }}-{{ context.headToHead.draws }}-{{ context.headToHead.awayWins }}
        <span class="text-slate-500">(L-E-V)</span>
      </p>
      <p v-if="lastHeadToHead" class="mt-0.5 text-slate-500">
        Último:
        {{ headToHeadScoreLabel(lastHeadToHead) }}
      </p>
    </div>
  </div>
</template>
