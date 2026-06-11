<script setup lang="ts">
import { computed } from 'vue'
import { Users } from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseQuinielaRound } from '@/types'

const selectedRoundId = defineModel<string>({ required: true })

const search = defineModel<string>('search', { default: '' })
const onlyWithParticipants = defineModel<boolean>('onlyWithParticipants', { default: true })

const { participantCounts, mobileFullScreen } = defineProps<{
  participantCounts: Record<string, number>
  mobileFullScreen?: boolean
}>()

const emit = defineEmits<{
  select: [roundId: string]
}>()

const baseStore = useBaseQuinielaStore()

const filteredRounds = computed(() => {
  const q = search.value.trim().toLowerCase()
  return baseStore.rounds.filter((round) => {
    if (onlyWithParticipants.value && !(participantCounts[round.id] ?? 0)) return false
    if (!q) return true
    const title = round.title.toLowerCase()
    const num = String(round.round_number)
    return title.includes(q) || num.includes(q)
  })
})

const roundsWithParticipants = computed(() =>
  baseStore.rounds.filter((r) => (participantCounts[r.id] ?? 0) > 0).length,
)

function selectRound(roundId: string) {
  selectedRoundId.value = roundId
  emit('select', roundId)
}
</script>

<template>
  <aside
    class="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/5"
    :class="mobileFullScreen ? 'h-full rounded-none border-x-0 border-t-0' : 'h-full'"
  >
    <header class="shrink-0 border-b border-white/10 p-4">
      <p v-if="!mobileFullScreen" class="text-sm font-medium text-slate-200">Jornadas</p>
      <p class="text-xs text-slate-500" :class="mobileFullScreen ? '' : 'mt-1'">
        {{ roundsWithParticipants }} con participantes · {{ baseStore.rounds.length }} total
      </p>

      <input
        v-model="search"
        type="search"
        placeholder="Buscar jornada..."
        class="mt-3 w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-3 text-base md:py-2 md:text-sm"
      />

      <label class="mt-3 flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-400 md:text-xs">
        <input
          v-model="onlyWithParticipants"
          type="checkbox"
          class="rounded border-white/20 bg-mundial-dark text-mundial-accent"
        />
        Solo con participantes
      </label>
    </header>

    <ul class="app-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
      <li v-if="baseStore.loading && !baseStore.rounds.length" class="px-3 py-8 text-center text-sm text-slate-500">
        Cargando jornadas...
      </li>

      <li v-else-if="!filteredRounds.length" class="px-3 py-8 text-center text-sm text-slate-500">
        No hay jornadas con estos filtros.
      </li>

      <li v-for="round in filteredRounds" :key="round.id" class="mb-1.5">
        <button
          type="button"
          class="w-full rounded-xl border p-4 text-left transition md:rounded-lg md:p-3"
          :class="
            selectedRoundId === round.id
              ? 'border-mundial-accent bg-mundial-accent/10 ring-1 ring-mundial-accent/50'
              : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
          "
          @click="selectRound(round.id)"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mundial-green/15 text-base font-bold text-mundial-green md:h-9 md:w-9 md:text-sm"
            >
              {{ round.round_number }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-200 md:text-xs">
                {{ round.title }}
              </p>
              <p class="text-[11px] text-slate-500">
                {{ round.match_count }} partidos · ${{ BASE_ENTRY_FEE_MXN }} MXN
              </p>
            </div>
          </div>

          <p
            v-if="participantCounts[round.id]"
            class="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300"
          >
            <Users class="h-3 w-3" />
            {{ participantCounts[round.id] }} participantes
          </p>
        </button>
      </li>
    </ul>
  </aside>
</template>
