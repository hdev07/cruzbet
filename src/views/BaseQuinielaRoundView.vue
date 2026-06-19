<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import BaseQuinielaGrid from '@/components/predictions/BaseQuinielaGrid.vue'
import BaseRoundRankingPanel from '@/components/ranking/BaseRoundRankingPanel.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const route = useRoute()
const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loadError = ref<string | null>(null)

const roundId = computed(() => route.params.id as string)

const progress = computed(() => baseStore.myProgress())
const myLeaderboardEntry = computed(() =>
  auth.user
    ? baseStore.leaderboard.find((e) => e.user_id === auth.user!.id)
    : undefined,
)

async function loadRound() {
  loadError.value = null
  try {
    await baseStore.fetchRound(roundId.value)
    await baseStore.fetchRoundLeaderboard(roundId.value)
    if (auth.user) {
      await baseStore.fetchMyPredictions(roundId.value, auth.user.id)
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'No se pudo cargar la jornada'
  }
}

onMounted(loadRound)
watch(roundId, loadRound)

async function onPredictionsUpdated() {
  await baseStore.fetchRoundLeaderboard(roundId.value)
}
</script>

<template>
  <div>
    <RouterLink
      to="/jornadas"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-mundial-green"
    >
      <ArrowLeft class="h-4 w-4" />
      Quiniela
    </RouterLink>

    <p v-if="baseStore.loading && !baseStore.currentRound" class="text-slate-400">
      Cargando jornada...
    </p>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <template v-else-if="baseStore.currentRound">
      <div class="mb-6">
        <h1 class="text-2xl font-bold lg:text-3xl">{{ baseStore.currentRound.title }}</h1>
        <p class="mt-1 text-sm text-slate-400">
          ${{ BASE_ENTRY_FEE_MXN }} MXN · {{ BASE_QUINIELA_MATCHES_PER_ROUND }} partidos ·
          {{ BASE_QUINIELA_POINTS_PER_HIT }} pts por acierto
        </p>
      </div>

      <div
        v-if="auth.isLoggedIn"
        class="mb-6 flex flex-wrap gap-3"
      >
        <div class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3">
          <p class="text-xs text-slate-400">Tu progreso</p>
          <p class="text-xl font-bold text-mundial-accent">
            {{ progress.filled }}/{{ progress.total }}
          </p>
        </div>
        <div
          v-if="myLeaderboardEntry"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <p class="text-xs text-slate-400">Tus aciertos</p>
          <p class="text-xl font-bold text-slate-200">
            {{ myLeaderboardEntry.correct_count }}
            <span class="text-sm font-normal text-slate-500">
              ({{ myLeaderboardEntry.total_points }} pts)
            </span>
          </p>
        </div>
      </div>

      <div
        v-else
        class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 text-center"
      >
        <p class="mb-3 text-sm text-slate-300">Inicia sesión para marcar tu quiniela</p>
        <RouterLink
          to="/login"
          class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold"
        >
          Entrar con Google
        </RouterLink>
      </div>

      <div class="xl:grid xl:grid-cols-3 xl:items-start xl:gap-8">
      <section class="mb-8 xl:col-span-2 xl:mb-0">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Grilla L · E · V
        </h2>
        <BaseQuinielaGrid
          :round-id="roundId"
          :user-id="auth.user?.id"
          :can-predict="auth.isLoggedIn"
          :round-matches="baseStore.roundMatches"
          @updated="onPredictionsUpdated"
        />
      </section>

      <section class="xl:col-span-1">
        <BaseRoundRankingPanel
          :round-id="roundId"
          :round-matches="baseStore.roundMatches"
          compact
        />
      </section>
      </div>
    </template>
  </div>
</template>
