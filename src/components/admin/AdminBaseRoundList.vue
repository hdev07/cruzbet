<script setup lang="ts">
import { computed } from 'vue'
import { Users } from '@lucide/vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

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
    class="admin-shell min-h-0"
    :class="mobileFullScreen ? 'admin-shell--flat h-full' : 'h-full'"
  >
    <header class="admin-panel-header space-y-3">
      <div>
        <p v-if="!mobileFullScreen" class="text-sm font-medium text-app-text">Jornadas</p>
        <p class="text-xs text-slate-500" :class="mobileFullScreen ? '' : 'mt-1'">
          {{ roundsWithParticipants }} con participantes · {{ baseStore.rounds.length }} total
        </p>
      </div>

      <input
        v-model="search"
        type="search"
        placeholder="Buscar jornada..."
        class="theme-field w-full rounded-xl px-3 py-2.5 text-sm"
      />

      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
        <input
          v-model="onlyWithParticipants"
          type="checkbox"
          class="rounded border-white/20 bg-transparent text-mundial-accent"
        />
        Solo con participantes
      </label>
    </header>

    <ul class="app-scrollbar admin-list">
      <li v-if="baseStore.loading && !baseStore.rounds.length" class="px-3 py-3">
        <DataSkeleton variant="list" :rows="5" />
      </li>

      <li v-else-if="!filteredRounds.length" class="admin-empty">
        No hay jornadas con estos filtros.
      </li>

      <li v-for="round in filteredRounds" :key="round.id" class="admin-list-item">
        <button
          type="button"
          class="admin-list-btn"
          :class="{ 'is-selected': selectedRoundId === round.id }"
          @click="selectRound(round.id)"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mundial-green/15 text-sm font-bold text-mundial-green"
            >
              {{ round.round_number }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-app-text">
                {{ round.title }}
              </p>
              <p class="text-xs text-slate-500">
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
