<script setup lang="ts">
import { ChevronRight, Radio, Users } from '@lucide/vue'
import type { Match } from '@/types'

defineProps<{ match: Match; showPredictBadge?: boolean; participantCount?: number }>()

const phaseLabels: Record<string, string> = {
  group: 'Grupos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  final: 'Final',
}
</script>

<template>
  <RouterLink
    :to="`/match/${match.id}`"
    class="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-mundial-accent/50 hover:bg-white/10 lg:p-5"
    :class="{ 'ring-2 ring-mundial-green animate-pulse': match.status === 'live' }"
  >
    <div class="mb-2 flex items-center justify-between text-xs text-slate-400">
      <span>{{ phaseLabels[match.phase ?? ''] ?? match.phase ?? 'Partido' }}</span>
      <span
        v-if="match.status === 'live'"
        class="inline-flex items-center gap-1 rounded-full bg-mundial-green px-2 py-0.5 font-semibold text-white"
      >
        <Radio class="h-3 w-3" />
        {{ match.current_minute ?? 0 }}' EN VIVO
      </span>
      <span v-else-if="match.status === 'finished'">Finalizado</span>
      <span v-else class="text-slate-500">
        {{ match.match_date ? new Date(match.match_date).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Por definir' }}
      </span>
    </div>

    <div class="flex items-center justify-between gap-4">
      <div class="flex flex-1 items-center gap-2">
        <img
          v-if="match.home_team?.flag_url"
          :src="match.home_team.flag_url"
          :alt="match.home_team.name"
          class="h-6 w-8 object-cover"
        />
        <span class="font-medium">{{ match.home_team?.name ?? 'Local' }}</span>
      </div>

      <div class="text-xl font-bold tabular-nums">
        <template v-if="match.status !== 'scheduled'">
          {{ match.home_score }} - {{ match.away_score }}
        </template>
        <template v-else>vs</template>
      </div>

      <div class="flex flex-1 items-center justify-end gap-2">
        <span class="font-medium">{{ match.away_team?.name ?? 'Visitante' }}</span>
        <img
          v-if="match.away_team?.flag_url"
          :src="match.away_team.flag_url"
          :alt="match.away_team.name"
          class="h-6 w-8 object-cover"
        />
      </div>
    </div>

    <p v-if="match.venue" class="mt-2 text-center text-xs text-slate-500">
      {{ match.venue }}
    </p>

    <p
      v-if="participantCount"
      class="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400"
    >
      <Users class="h-3.5 w-3.5 shrink-0" />
      {{ participantCount }} {{ participantCount === 1 ? 'participante' : 'participantes' }}
    </p>

    <div v-if="showPredictBadge" class="mt-3 text-center">
      <span class="inline-flex items-center gap-1 rounded-lg bg-mundial-accent/20 px-3 py-1 text-xs font-semibold text-mundial-accent">
        Predecir
        <ChevronRight class="h-3.5 w-3.5" />
      </span>
    </div>
  </RouterLink>
</template>
