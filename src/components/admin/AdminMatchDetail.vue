<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatMatchClock, LIVE_STATUS_DETAIL_LABELS } from '@/lib/matchClock'
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import AdminPaymentVerification from '@/components/admin/AdminPaymentVerification.vue'
import QuinielaControl from '@/components/admin/QuinielaControl.vue'
import type { Match } from '@/types'

const { match, mobile } = defineProps<{
  match: Match
  mobile?: boolean
}>()

type DetailTab = 'control' | 'payments'
const tab = ref<DetailTab>('control')

const statusLabel = computed(() => {
  if (match.status === 'live') {
    if (match.live_status_detail) {
      const detail = LIVE_STATUS_DETAIL_LABELS[match.live_status_detail]
      return detail ? detail.charAt(0) + detail.slice(1).toLowerCase() : 'En vivo'
    }
    return 'En vivo'
  }
  if (match.status === 'finished') return 'Finalizado'
  return 'Programado'
})

const statusClass = computed(() => {
  if (match.status === 'live') {
    return match.live_status_detail === 'delayed'
      ? 'bg-amber-500/20 text-amber-300'
      : 'bg-mundial-green/20 text-mundial-green'
  }
  if (match.status === 'finished') return 'bg-slate-500/20 text-slate-400'
  return 'bg-amber-500/15 text-amber-200'
})

function formatDate() {
  if (!match.match_date) return '—'
  return new Date(match.match_date).toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <header
      class="shrink-0 rounded-xl border border-white/10 bg-white/5 p-4"
      :class="mobile ? 'mx-0 rounded-none border-x-0' : ''"
    >
      <div class="flex flex-wrap items-center justify-center gap-2 text-center">
        <TeamFlag
          v-if="match.home_team?.flag_url"
          :src="match.home_team.flag_url"
          :alt="teamDisplayName(match.home_team, 'Local')"
          img-class="h-7 w-10 rounded-sm object-cover"
        />
        <span class="text-base font-bold text-slate-100">
          {{ teamDisplayName(match.home_team, 'Local') }}
        </span>
        <span class="text-xl font-bold tabular-nums text-mundial-accent">
          <template v-if="match.status !== 'scheduled'">
            {{ match.home_score }} - {{ match.away_score }}
          </template>
          <template v-else>vs</template>
        </span>
        <span class="text-base font-bold text-slate-100">
          {{ teamDisplayName(match.away_team, 'Visita') }}
        </span>
        <TeamFlag
          v-if="match.away_team?.flag_url"
          :src="match.away_team.flag_url"
          :alt="teamDisplayName(match.away_team, 'Visitante')"
          img-class="h-7 w-10 rounded-sm object-cover"
        />
      </div>
      <div class="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span class="rounded-full px-2.5 py-0.5 font-semibold" :class="statusClass">
          {{ statusLabel }}
          <template v-if="match.status === 'live'"> · {{ formatMatchClock(match) || `${match.current_minute ?? 0}'` }}</template>
        </span>
        <span class="text-slate-500">{{ formatDate() }}</span>
        <span v-if="match.venue" class="text-slate-500">· {{ match.venue }}</span>
      </div>
    </header>

    <nav
      class="mt-3 flex shrink-0 gap-1 rounded-lg border border-white/10 bg-black/20 p-1"
      :class="mobile ? 'mx-4' : ''"
    >
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-xs font-semibold transition md:py-1.5"
        :class="tab === 'control' ? 'bg-mundial-accent text-white' : 'text-slate-400 hover:text-slate-200'"
        @click="tab = 'control'"
      >
        Partido y goles
      </button>
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-xs font-semibold transition md:py-1.5"
        :class="tab === 'payments' ? 'bg-mundial-accent text-white' : 'text-slate-400 hover:text-slate-200'"
        @click="tab = 'payments'"
      >
        Pagos
      </button>
    </nav>

    <div
      class="app-scrollbar min-h-0 flex-1 overflow-y-auto py-4"
      :class="mobile ? 'px-4' : 'mt-1'"
    >
      <QuinielaControl v-if="tab === 'control'" :match="match" :mobile="mobile" />
      <AdminPaymentVerification v-else :match="match" :mobile="mobile" />
    </div>
  </div>
</template>
