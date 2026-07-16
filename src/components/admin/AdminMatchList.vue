<script setup lang="ts">
import { computed } from 'vue'
import { Radio, Users } from '@lucide/vue'
import { formatMatchClock } from '@/lib/matchClock'
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { useMatchStore } from '@/stores/matchStore'
import type { Match, MatchStatus } from '@/types'

const selectedMatchId = defineModel<string>({ required: true })

const search = defineModel<string>('search', { default: '' })
const statusFilter = defineModel<'all' | MatchStatus>('statusFilter', { default: 'all' })
const onlyWithParticipants = defineModel<boolean>('onlyWithParticipants', { default: false })

const { participantCounts, mobileFullScreen } = defineProps<{
  participantCounts?: Record<string, number>
  mobileFullScreen?: boolean
}>()

const emit = defineEmits<{
  select: [matchId: string]
}>()

const matchStore = useMatchStore()

const counts = computed(() => participantCounts ?? {})

const filteredMatches = computed(() => {
  const q = search.value.trim().toLowerCase()
  return matchStore.matches.filter((m) => {
    if (statusFilter.value !== 'all' && m.status !== statusFilter.value) return false
    if (onlyWithParticipants.value && !(counts.value[m.id] ?? 0)) return false
    if (!q) return true
    const home = teamDisplayName(m.home_team, 'Local').toLowerCase()
    const away = teamDisplayName(m.away_team, 'Visitante').toLowerCase()
    const homeCode = m.home_team?.code?.toLowerCase() ?? ''
    const awayCode = m.away_team?.code?.toLowerCase() ?? ''
    const venue = m.venue?.toLowerCase() ?? ''
    return (
      home.includes(q) ||
      away.includes(q) ||
      homeCode.includes(q) ||
      awayCode.includes(q) ||
      venue.includes(q)
    )
  })
})

function selectMatch(matchId: string) {
  selectedMatchId.value = matchId
  emit('select', matchId)
}

function formatDate(match: Match) {
  if (!match.match_date) return null
  return new Date(match.match_date).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <aside
    class="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/5"
    :class="mobileFullScreen ? 'h-full rounded-none border-x-0 border-t-0' : 'h-full'"
  >
    <header class="shrink-0 border-b border-white/10 p-4">
      <p v-if="!mobileFullScreen" class="text-sm font-medium text-slate-200">Partidos</p>
      <p class="text-xs text-slate-500" :class="mobileFullScreen ? '' : 'mt-1'">
        {{ matchStore.matches.length }} partidos
      </p>

      <input
        v-model="search"
        type="search"
        placeholder="Buscar equipo..."
        class="mt-3 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-3 text-base md:py-2 md:text-sm"
      />

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="f in ([['all', 'Todos'], ['scheduled', 'Prog.'], ['live', 'Vivo'], ['finished', 'Fin.']] as const)"
          :key="f[0]"
          type="button"
          class="rounded-lg px-3 py-2 text-xs font-medium md:rounded-md md:px-2 md:py-1 md:text-[11px]"
          :class="statusFilter === f[0] ? 'bg-mundial-accent text-white' : 'bg-white/10 text-slate-400'"
          @click="statusFilter = f[0]"
        >
          {{ f[1] }}
        </button>
      </div>
    </header>

    <ul class="app-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
      <li v-if="!filteredMatches.length" class="px-3 py-8 text-center text-sm text-slate-500">
        No hay partidos con estos filtros.
      </li>

      <li v-for="match in filteredMatches" :key="match.id" class="mb-1.5">
        <button
          type="button"
          class="w-full rounded-xl border p-4 text-left transition md:rounded-lg md:p-3"
          :class="
            selectedMatchId === match.id
              ? 'border-mundial-accent bg-mundial-accent/10 ring-1 ring-mundial-accent/50'
              : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
          "
          @click="selectMatch(match.id)"
        >
          <div class="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-slate-500">
            <span>{{ match.phase ?? 'Liga MX' }}</span>
            <span class="flex items-center gap-1">
              <span
                v-if="match.auto_sync_enabled !== false"
                class="rounded bg-mundial-green/15 px-1 py-0.5 text-[9px] font-semibold normal-case text-mundial-green"
                title="Sync automático activo"
              >
                sync
              </span>
              <span
                v-if="match.status === 'live'"
                class="inline-flex items-center gap-0.5 rounded-full bg-mundial-green px-1.5 py-0.5 font-semibold normal-case text-white"
              >
                <Radio class="h-2.5 w-2.5" />
                {{ formatMatchClock(match) || `${match.current_minute ?? 0}'` }}
              </span>
              <span v-else-if="match.status === 'finished'" class="normal-case">Fin</span>
              <span v-else class="normal-case">{{ formatDate(match) ?? '—' }}</span>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <TeamFlag
              v-if="match.home_team?.flag_url"
              :src="match.home_team.flag_url"
              :alt="teamDisplayName(match.home_team, 'Local')"
              img-class="h-6 w-8 shrink-0 rounded-sm object-cover md:h-5 md:w-7"
            />
            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200 md:text-xs">
              {{ teamDisplayName(match.home_team, 'Local') }}
            </span>
            <span class="shrink-0 text-sm font-bold tabular-nums text-mundial-accent">
              <template v-if="match.status !== 'scheduled'">
                {{ match.home_score }}-{{ match.away_score }}
              </template>
              <template v-else>vs</template>
            </span>
            <span class="min-w-0 flex-1 truncate text-right text-sm font-semibold text-slate-200 md:text-xs">
              {{ teamDisplayName(match.away_team, 'Visitante') }}
            </span>
            <TeamFlag
              v-if="match.away_team?.flag_url"
              :src="match.away_team.flag_url"
              :alt="teamDisplayName(match.away_team, 'Visitante')"
              img-class="h-5 w-7 shrink-0 rounded-sm object-cover"
            />
          </div>

          <p
            v-if="counts[match.id]"
            class="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300"
          >
            <Users class="h-3 w-3" />
            {{ counts[match.id] }} en quiniela
          </p>
        </button>
      </li>
    </ul>
  </aside>
</template>
