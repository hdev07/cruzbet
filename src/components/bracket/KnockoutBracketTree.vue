<script setup lang="ts">
import { Radio } from '@lucide/vue'
import BracketMatchCertainty from '@/components/predictions/BracketMatchCertainty.vue'
import {
  analyzeMatchBracket,
  isKnockoutBracketMatch,
} from '@/lib/bracketSlotCertainty'
import {
  bracketParticipantLabel,
  matchBracketLabel,
  type BracketRound,
} from '@/lib/knockoutBracket'
import { formatLiveStatusLabel } from '@/lib/matchClock'
import { phaseLabel } from '@/lib/matchPhases'
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { Match, Team } from '@/types'

const props = defineProps<{
  rounds: BracketRound[]
  teams: Team[]
  allMatches: Match[]
}>()

function sideLabel(match: Match, side: 'home' | 'away'): string {
  const team = side === 'home' ? match.home_team : match.away_team
  if (team) return teamDisplayName(team)
  if (isKnockoutBracketMatch(match) && props.teams.length) {
    const analysis = analyzeMatchBracket(match, props.teams, props.allMatches)
    return side === 'home' ? analysis.home.displayName : analysis.away.displayName
  }
  return bracketParticipantLabel(match, side)
}

function sideItalic(match: Match, side: 'home' | 'away'): boolean {
  const team = side === 'home' ? match.home_team : match.away_team
  if (team) return false
  if (!isKnockoutBracketMatch(match) || !props.teams.length) return true
  const analysis = analyzeMatchBracket(match, props.teams, props.allMatches)
  const slot = side === 'home' ? analysis.home : analysis.away
  return slot.status !== 'confirmed'
}

function sideFlag(match: Match, side: 'home' | 'away'): string | null {
  const team = side === 'home' ? match.home_team : match.away_team
  return team?.flag_url ?? null
}

function isWinner(match: Match, side: 'home' | 'away'): boolean {
  if (match.status !== 'finished') return false
  if (side === 'home') return match.home_score > match.away_score
  return match.away_score > match.home_score
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Por definir'
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="overflow-x-auto pb-2">
    <div class="flex min-w-max gap-4 lg:gap-6">
      <section
        v-for="round in rounds"
        :key="round.phase"
        class="flex w-56 shrink-0 flex-col lg:w-64"
      >
        <h3 class="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          {{ round.label }}
        </h3>

        <div
          class="flex flex-1 flex-col justify-around gap-3"
          :class="{
            'gap-4': round.phase === 'r32',
            'gap-5': round.phase === 'r16',
            'gap-8': round.phase === 'qf',
            'gap-16': round.phase === 'sf',
          }"
        >
          <article
            v-for="match in round.matches"
            :key="match.id"
            class="rounded-xl border border-white/10 bg-white/5 p-3 transition"
            :class="{
              'ring-2 ring-mundial-green': match.status === 'live',
              'border-mundial-accent/40': round.phase === 'final',
            }"
          >
            <div class="mb-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
              <span>{{ match.bracket_key ?? phaseLabel(match.phase) }}</span>
              <span
                v-if="match.status === 'live'"
                class="inline-flex items-center gap-0.5 font-semibold"
                :class="match.live_status_detail === 'delayed' ? 'text-amber-400' : 'text-mundial-green'"
              >
                <Radio class="h-3 w-3" />
                {{ formatLiveStatusLabel(match) }}
              </span>
              <span v-else-if="match.status === 'finished'" class="text-slate-400">Final</span>
              <span v-else>{{ formatDate(match.match_date) }}</span>
            </div>

            <div
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
              :class="isWinner(match, 'home') ? 'bg-mundial-accent/15 font-semibold' : ''"
            >
              <TeamFlag
                v-if="sideFlag(match, 'home')"
                :src="sideFlag(match, 'home')"
                :alt="sideLabel(match, 'home')"
                img-class="h-4 w-5 shrink-0 object-cover"
              />
              <span
                class="min-w-0 flex-1 truncate"
                :class="sideItalic(match, 'home') ? 'italic text-slate-400' : ''"
              >
                {{ sideLabel(match, 'home') }}
              </span>
              <span
                v-if="match.status !== 'scheduled'"
                class="shrink-0 tabular-nums text-slate-300"
              >
                {{ match.home_score }}
              </span>
            </div>

            <div
              class="mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
              :class="isWinner(match, 'away') ? 'bg-mundial-accent/15 font-semibold' : ''"
            >
              <TeamFlag
                v-if="sideFlag(match, 'away')"
                :src="sideFlag(match, 'away')"
                :alt="sideLabel(match, 'away')"
                img-class="h-4 w-5 shrink-0 object-cover"
              />
              <span
                class="min-w-0 flex-1 truncate"
                :class="sideItalic(match, 'away') ? 'italic text-slate-400' : ''"
              >
                {{ sideLabel(match, 'away') }}
              </span>
              <span
                v-if="match.status !== 'scheduled'"
                class="shrink-0 tabular-nums text-slate-300"
              >
                {{ match.away_score }}
              </span>
            </div>

            <BracketMatchCertainty
              v-if="isKnockoutBracketMatch(match)"
              :match="match"
              :teams="teams"
              :all-matches="allMatches"
              compact
              class="mt-2"
            />

            <p
              v-if="match.venue"
              class="mt-2 truncate text-center text-[10px] text-slate-500"
              :title="match.venue"
            >
              {{ match.venue }}
            </p>
            <p
              v-else
              class="mt-2 truncate text-center text-[10px] italic text-slate-600"
            >
              {{ matchBracketLabel(match) }}
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
