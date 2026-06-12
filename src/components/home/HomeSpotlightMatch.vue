<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Clock, Radio } from '@lucide/vue'
import { formatKickoff } from '@/lib/matchRules'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { Match } from '@/types'

const props = defineProps<{
  match: Match
  isLive: boolean
}>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const phaseLabels: Record<string, string> = {
  group: 'Fase de grupos',
  r16: 'Octavos de final',
  qf: 'Cuartos de final',
  sf: 'Semifinal',
  final: 'Final',
}

const kickoffLabel = computed(() => formatKickoff(props.match))

const countdown = computed(() => {
  if (!props.match.match_date || props.isLive) return null
  const diff = new Date(props.match.match_date).getTime() - now.value
  if (diff <= 0) return 'Por comenzar'
  const hours = Math.floor(diff / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (hours >= 48) {
    const days = Math.floor(hours / 24)
    return `Faltan ${days} ${days === 1 ? 'día' : 'días'}`
  }
  if (hours > 0) return `Faltan ${hours}h ${mins}m`
  return `Faltan ${mins} min`
})
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border-2"
    :class="
      isLive
        ? 'border-mundial-green/60 bg-gradient-to-br from-mundial-green/20 via-mundial-green/5 to-transparent ring-1 ring-mundial-green/30'
        : 'border-white/15 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent'
    "
  >
    <div class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 sm:px-5">
      <div class="flex items-center gap-2">
        <span
          v-if="isLive"
          class="inline-flex items-center gap-1.5 rounded-full bg-mundial-green px-2.5 py-0.5 text-xs font-bold text-white"
        >
          <Radio class="h-3 w-3 animate-pulse" />
          EN VIVO · {{ match.current_minute ?? 0 }}'
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300"
        >
          <Clock class="h-3 w-3" />
          Próximo partido
        </span>
        <span class="hidden text-xs text-slate-500 sm:inline">
          {{ phaseLabels[match.phase ?? ''] ?? match.phase }}
        </span>
      </div>
      <span v-if="countdown" class="text-xs font-medium tabular-nums text-slate-400">
        {{ countdown }}
      </span>
    </div>

    <div class="px-4 py-5 sm:px-6 sm:py-6">
      <div class="flex items-center justify-between gap-3 sm:gap-6">
        <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <img
            v-if="match.home_team?.flag_url"
            :src="match.home_team.flag_url"
            :alt="teamDisplayName(match.home_team, 'Local')"
            class="h-12 w-16 object-cover shadow-md sm:h-14 sm:w-20"
          />
          <span class="w-full truncate text-sm font-semibold sm:text-base">
            {{ teamDisplayName(match.home_team, 'Local') }}
          </span>
        </div>

        <div class="shrink-0 text-center">
          <p
            v-if="isLive || match.status === 'finished'"
            class="text-3xl font-black tabular-nums tracking-tight sm:text-4xl"
          >
            {{ match.home_score }}
            <span class="mx-1 text-slate-500">-</span>
            {{ match.away_score }}
          </p>
          <p v-else class="text-2xl font-bold text-slate-500 sm:text-3xl">VS</p>
          <p v-if="kickoffLabel && !isLive" class="mt-1 text-[11px] text-slate-500 sm:text-xs">
            {{ kickoffLabel }}
          </p>
        </div>

        <div class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <img
            v-if="match.away_team?.flag_url"
            :src="match.away_team.flag_url"
            :alt="teamDisplayName(match.away_team, 'Visitante')"
            class="h-12 w-16 object-cover shadow-md sm:h-14 sm:w-20"
          />
          <span class="w-full truncate text-sm font-semibold sm:text-base">
            {{ teamDisplayName(match.away_team, 'Visitante') }}
          </span>
        </div>
      </div>

      <p v-if="match.venue" class="mt-3 text-center text-xs text-slate-500">
        {{ match.venue }}
      </p>
    </div>
  </div>
</template>
