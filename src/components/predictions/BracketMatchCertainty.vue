<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, HelpCircle, Radio } from '@lucide/vue'
import {
  analyzeMatchBracket,
  isKnockoutBracketMatch,
  publicBracketSideLabel,
  type SlotSideAnalysis,
} from '@/lib/bracketSlotCertainty'
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { Match, Team } from '@/types'

const props = defineProps<{
  match: Match
  teams: Team[]
  allMatches: Match[]
  compact?: boolean
}>()

const analysis = computed(() => {
  if (!isKnockoutBracketMatch(props.match)) return null
  return analyzeMatchBracket(props.match, props.teams, props.allMatches)
})

const levelClass = computed(() => {
  switch (analysis.value?.level) {
    case 'confirmed':
      return 'border-mundial-green/30 bg-mundial-green/10 text-mundial-green'
    case 'provisional':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    case 'partial':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-200'
    default:
      return 'border-white/10 bg-white/5 text-slate-400'
  }
})

function sideStatusClass(status: SlotSideAnalysis['status']): string {
  if (status === 'confirmed') return 'text-mundial-green'
  if (status === 'provisional') return 'text-amber-300'
  return 'text-slate-500'
}

function sideStatusLabel(status: SlotSideAnalysis['status']): string {
  if (status === 'confirmed') return 'Confirmado'
  if (status === 'provisional') return 'Provisional'
  return 'En disputa'
}

function sidePublicName(sideKey: 'home' | 'away', side: SlotSideAnalysis): string {
  if (!analysis.value) return side.displayName
  const slot =
    sideKey === 'home' ? props.match.bracket_meta?.home : props.match.bracket_meta?.away
  return publicBracketSideLabel(side, slot)
}

function showPossibleTeams(side: SlotSideAnalysis): boolean {
  return side.status !== 'confirmed' && side.possibleTeams.length > 1
}
</script>

<template>
  <div
    v-if="analysis"
    class="rounded-lg border text-xs"
    :class="[levelClass, compact ? 'px-2 py-1.5' : 'px-2.5 py-2']"
  >
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <CheckCircle2 v-if="analysis.level === 'confirmed'" class="h-3.5 w-3.5 shrink-0" />
      <Radio v-else-if="analysis.level === 'provisional'" class="h-3.5 w-3.5 shrink-0" />
      <HelpCircle v-else class="h-3.5 w-3.5 shrink-0" />
      <span class="font-semibold">{{ analysis.levelLabel }}</span>
    </div>

    <div class="mt-2 space-y-2">
      <div
        v-for="side in ([['home', analysis.home], ['away', analysis.away]] as const)"
        :key="side[0]"
      >
        <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span class="text-[0.6rem] font-bold uppercase tracking-wide text-slate-500">
            {{ side[0] === 'home' ? 'Local' : 'Visita' }}
          </span>
          <span class="font-medium" :class="sideStatusClass(side[1].status)">
            {{ sidePublicName(side[0], side[1]) }}
          </span>
          <span class="text-[0.6rem] text-slate-500">({{ sideStatusLabel(side[1].status) }})</span>
        </div>
        <p v-if="side[1].detail" class="mt-0.5 text-[0.65rem] leading-snug text-slate-400">
          {{ side[1].detail }}
        </p>
        <div
          v-if="showPossibleTeams(side[1])"
          class="mt-1 flex flex-wrap gap-1"
        >
          <span class="text-[0.6rem] text-slate-500">En disputa:</span>
          <span
            v-for="team in side[1].possibleTeams"
            :key="team.id"
            class="inline-flex items-center gap-0.5 rounded bg-black/20 px-1 py-0.5 text-[0.6rem] text-slate-300"
          >
            <TeamFlag
              v-if="team.flag_url"
              :src="team.flag_url"
              :alt="teamDisplayName(team)"
              img-class="h-2.5 w-3.5 rounded object-cover"
            />
            {{ teamDisplayName(team) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
