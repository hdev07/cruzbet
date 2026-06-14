<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import BaseRoundRankingPanel from '@/components/ranking/BaseRoundRankingPanel.vue'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loadError = ref<string | null>(null)
const roundLoading = ref(false)
const selectedRoundId = ref<string | null>(null)
let loadSeq = 0

const activeRoundId = computed(() => selectedRoundId.value ?? baseStore.activeRound?.id ?? null)

async function loadRoundData(roundId: string) {
  const seq = ++loadSeq
  loadError.value = null
  roundLoading.value = true
  try {
    await baseStore.fetchRound(roundId)
    if (seq !== loadSeq) return

    await baseStore.fetchRoundLeaderboard(roundId)
    if (seq !== loadSeq) return

    if (auth.user) {
      await baseStore.fetchMyPredictions(roundId, auth.user.id)
    }
  } catch (err) {
    if (seq !== loadSeq) return
    loadError.value = err instanceof Error ? err.message : 'No se pudo cargar el ranking'
  } finally {
    if (seq === loadSeq) roundLoading.value = false
  }
}

onMounted(async () => {
  loadError.value = null
  try {
    await baseStore.fetchRounds()
    if (!selectedRoundId.value && baseStore.activeRound) {
      selectedRoundId.value = baseStore.activeRound.id
    }
    if (activeRoundId.value) {
      await loadRoundData(activeRoundId.value)
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'No se pudo cargar el ranking'
  }
})

watch(activeRoundId, (roundId, prevRoundId) => {
  if (!roundId || roundId === prevRoundId) return
  void loadRoundData(roundId)
})
</script>

<template>
  <div>
    <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
      Clasificación
    </p>
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Ranking</h1>
    <p class="mb-6 text-sm text-slate-400 lg:text-base">
      Posiciones y pronósticos por jornada
    </p>

    <p v-if="baseStore.loading && !baseStore.rounds.length" class="text-slate-400">
      Cargando ranking...
    </p>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <div
      v-else-if="!baseStore.rounds.length"
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      Aún no hay jornadas disponibles.
    </div>

    <template v-else>
      <label v-if="baseStore.rounds.length > 1" class="mb-6 block max-w-sm">
        <span class="mb-1 block text-xs text-slate-400">Jornada</span>
        <select
          v-model="selectedRoundId"
          class="w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2 text-sm"
        >
          <option v-for="round in baseStore.rounds" :key="round.id" :value="round.id">
            {{ round.title }}
          </option>
        </select>
      </label>

      <div
        v-if="auth.isLoggedIn && baseStore.myPredictions.length"
        class="mb-6 flex flex-wrap gap-3"
      >
        <div class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3">
          <p class="text-xs text-slate-400">Tu progreso</p>
          <p class="text-xl font-bold text-mundial-accent">
            {{ baseStore.myProgress().filled }}/{{ baseStore.myProgress().total }}
          </p>
        </div>
      </div>

      <BaseRoundRankingPanel
        v-if="activeRoundId"
        :round-id="activeRoundId"
        :round-matches="baseStore.roundMatches"
        :loading="roundLoading"
      />

      <RouterLink
        v-if="activeRoundId"
        :to="`/jornadas/${activeRoundId}`"
        class="mt-4 inline-flex items-center gap-1 text-sm text-mundial-green hover:underline"
      >
        Ir a la jornada para marcar tus picks
        <ChevronRight class="h-4 w-4" />
      </RouterLink>

      <RouterLink
        to="/resultados"
        class="mt-6 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        Ver ganadores y podio por jornada
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </template>
  </div>
</template>
