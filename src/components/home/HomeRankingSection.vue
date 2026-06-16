<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import BaseRoundRankingPanel from '@/components/ranking/BaseRoundRankingPanel.vue'
import { RANKING_PATH } from '@/constants/nav'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const baseStore = useBaseQuinielaStore()
const loading = ref(false)
const loadError = ref<string | null>(null)
let loadSeq = 0

const activeRoundId = computed(() => baseStore.activeRound?.id ?? null)

async function loadActiveRoundData() {
  const roundId = activeRoundId.value
  if (!roundId) return

  const seq = ++loadSeq
  loading.value = true
  loadError.value = null
  try {
    await baseStore.fetchRound(roundId)
    if (seq !== loadSeq) return

    await baseStore.fetchRoundLeaderboard(roundId)
  } catch (err) {
    if (seq !== loadSeq) return
    loadError.value = err instanceof Error ? err.message : 'No se pudo cargar las posiciones'
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

onMounted(async () => {
  if (!baseStore.rounds.length) {
    await baseStore.fetchRounds()
  }
  await loadActiveRoundData()
})

watch(activeRoundId, (roundId, prevRoundId) => {
  if (!roundId || roundId === prevRoundId) return
  void loadActiveRoundData()
})
</script>

<template>
  <section v-if="activeRoundId" class="mt-6">
    <div class="mb-4 flex items-end justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
          Clasificación
        </p>
        <h2 class="mt-1 text-lg font-bold text-slate-100">
          Posiciones
          <span v-if="baseStore.activeRound" class="font-normal text-slate-400">
            · {{ baseStore.activeRound.title }}
          </span>
        </h2>
      </div>
      <RouterLink
        :to="RANKING_PATH"
        class="inline-flex shrink-0 items-center gap-1 text-xs text-mundial-green hover:underline sm:text-sm"
      >
        Ver ranking
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <p v-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <BaseRoundRankingPanel
      v-else
      :round-id="activeRoundId"
      :round-matches="baseStore.roundMatches"
      :loading="loading"
      compact
      standings-only
    />
  </section>
</template>
