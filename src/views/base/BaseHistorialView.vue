<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import { winnerCode } from '@/lib/baseQuinielaDisplay'
import { QUINIELA_MODE_BASE } from '@/constants/quiniela-modes'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BasePrediction, BaseQuinielaRound, Match } from '@/types'

type HistoryRow = BasePrediction & {
  round?: BaseQuinielaRound
  match?: Match
}

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loading = ref(false)
const history = ref<HistoryRow[]>([])

onMounted(async () => {
  if (!auth.user) return
  loading.value = true
  try {
    history.value = await baseStore.fetchUserHistory(auth.user.id)
  } finally {
    loading.value = false
  }
})

const groupedByRound = computed(() => {
  const map = new Map<string, { round: BaseQuinielaRound | undefined; picks: HistoryRow[] }>()
  for (const row of history.value) {
    const key = row.round_id
    if (!map.has(key)) {
      map.set(key, { round: row.round, picks: [] })
    }
    map.get(key)!.picks.push(row)
  }
  return [...map.values()].sort(
    (a, b) => (b.round?.round_number ?? 0) - (a.round?.round_number ?? 0),
  )
})
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Historial</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ QUINIELA_MODE_BASE.title }} — tus picks L/E/V por jornada
    </p>

    <div
      v-if="!auth.isLoggedIn"
      class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-6 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para ver tu historial</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-green px-4 py-2 text-sm font-semibold text-mundial-dark"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <template v-else>
      <p v-if="loading" class="text-slate-400">Cargando historial...</p>

      <div
        v-else-if="!groupedByRound.length"
        class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
      >
        Aún no tienes predicciones en la quiniela base.
      </div>

      <div v-else class="space-y-4 lg:max-w-2xl">
        <section
          v-for="group in groupedByRound"
          :key="group.round?.id ?? group.picks[0]?.round_id"
          class="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="font-semibold text-slate-200">
              {{ group.round?.title ?? 'Jornada' }}
            </h2>
            <RouterLink
              v-if="group.round"
              :to="`/quiniela-base/${group.round.id}`"
              class="inline-flex items-center gap-1 text-xs text-mundial-green hover:underline"
            >
              Ver jornada
              <ChevronRight class="h-3.5 w-3.5" />
            </RouterLink>
          </div>

          <ul class="space-y-2">
            <li
              v-for="pick in group.picks"
              :key="pick.id"
              class="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
            >
              <span class="font-bold text-mundial-green">{{ winnerCode(pick.predicted_winner) }}</span>
              <span class="min-w-0 flex-1 truncate text-slate-300">
                {{ pick.match?.home_team?.code ?? 'LOC' }}
                vs
                {{ pick.match?.away_team?.code ?? 'VIS' }}
              </span>
              <span
                v-if="pick.scored_at"
                class="shrink-0 text-xs font-semibold tabular-nums"
                :class="pick.points > 0 ? 'text-mundial-green' : 'text-red-400'"
              >
                {{ pick.points }} pts
              </span>
              <span v-else class="shrink-0 text-xs text-slate-500">Pendiente</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
