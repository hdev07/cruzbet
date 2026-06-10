<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ChevronLeft, Radio, Trophy } from '@lucide/vue'
import { useRealtime } from '@/composables/useRealtime'
import { formatGoalEventTime } from '@/lib/predictionMinutes'
import { formatKickoff, isMatchOpenForPredictions, predictionsCloseMessage } from '@/lib/matchRules'
import { useAuthStore } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'
import { usePredictionStore, type MatchRankingEntry } from '@/stores/predictionStore'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import MatchPredictionsPanel from '@/components/predictions/MatchPredictionsPanel.vue'
import type { Prediction } from '@/types'

const route = useRoute()
const auth = useAuthStore()
const matchStore = useMatchStore()
const predictions = usePredictionStore()
const matchId = route.params.id as string

const myPredictions = ref<Prediction[]>([])
const matchRanking = ref<MatchRankingEntry[]>([])
const hasVerifiedWinner = computed(() => matchRanking.value.length > 0)

const { events } = useRealtime(matchId)
const match = computed(() => matchStore.currentMatch)
const goals = computed(() => events.value.filter((e) => e.event_type === 'goal'))
const canPredict = computed(() => match.value && isMatchOpenForPredictions(match.value))
const kickoffLabel = computed(() => (match.value ? formatKickoff(match.value) : null))
const editHint = computed(() => (match.value ? predictionsCloseMessage(match.value) : null))
const hasPredictions = computed(() => myPredictions.value.length > 0)
const userId = computed(() => auth.user?.id ?? '')

onMounted(async () => {
  await matchStore.fetchMatch(matchId)
  await loadPredictionData()
})

watch(() => auth.user?.id, () => loadPredictionData())

async function loadPredictionData() {
  if (auth.user) {
    myPredictions.value = await predictions.fetchMyPredictions(matchId, auth.user.id)
    if (auth.profile) await auth.fetchProfile(auth.user.id)
  } else {
    myPredictions.value = []
  }
  matchRanking.value = await predictions.fetchMatchRanking(matchId)
}
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <RouterLink
      to="/quiniela-partido"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
    >
      <ChevronLeft class="h-4 w-4" />
      Volver a partidos
    </RouterLink>

    <p v-if="matchStore.loading" class="text-slate-400">Cargando partido...</p>
    <p v-else-if="!match" class="text-red-300">Partido no encontrado</p>

    <template v-else>
      <div class="md:grid md:grid-cols-3 md:items-start md:gap-6 lg:gap-8">
        <div class="md:col-span-2">
          <header class="rounded-xl border border-white/10 bg-white/5 p-6 text-center lg:p-8">
            <p class="mb-1 inline-flex items-center justify-center gap-1 text-xs text-slate-400">
              <Trophy class="h-3.5 w-3.5" />
              Mundial 2026
            </p>
            <p
              v-if="match.status === 'live'"
              class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-mundial-green px-3 py-0.5 text-sm font-semibold"
            >
              <Radio class="h-3.5 w-3.5 animate-pulse" />
              EN VIVO · {{ match.current_minute ?? 0 }}'
            </p>
            <p v-else-if="match.status === 'finished'" class="mb-3 text-sm text-slate-400">Finalizado</p>
            <p v-else-if="kickoffLabel" class="mb-3 text-sm text-slate-400">
              Inicio: {{ kickoffLabel }}
            </p>
            <p v-else class="mb-3 text-sm text-slate-400">Programado</p>

            <div class="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              <div class="flex min-w-0 flex-1 flex-col items-center gap-2">
                <img
                  v-if="match.home_team?.flag_url"
                  :src="match.home_team.flag_url"
                  :alt="match.home_team.name"
                  class="h-12 w-12 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                />
                <p class="w-full truncate px-1 text-center text-sm font-bold lg:text-base">
                  {{ match.home_team?.name }}
                </p>
              </div>
              <p class="shrink-0 text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">
                {{ match.home_score }} - {{ match.away_score }}
              </p>
              <div class="flex min-w-0 flex-1 flex-col items-center gap-2">
                <img
                  v-if="match.away_team?.flag_url"
                  :src="match.away_team.flag_url"
                  :alt="match.away_team.name"
                  class="h-12 w-12 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                />
                <p class="w-full truncate px-1 text-center text-sm font-bold lg:text-base">
                  {{ match.away_team?.name }}
                </p>
              </div>
            </div>
          </header>

          <div
            v-if="!auth.isLoggedIn"
            class="mt-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-6 text-center lg:p-8"
          >
            <p class="mb-4 text-sm text-slate-300">Inicia sesión para hacer tu predicción</p>
            <RouterLink to="/login" class="inline-block rounded-lg bg-mundial-accent px-6 py-2 font-semibold">
              Entrar con Google
            </RouterLink>
          </div>

          <template v-else>
            <MatchPredictionsPanel
              v-if="canPredict || hasPredictions"
              class="mt-6"
              :match="match"
              :user-id="userId"
              :predictions="myPredictions"
              :can-predict="!!canPredict"
              :edit-hint="editHint"
              @updated="loadPredictionData"
            />

            <div
              v-else
              class="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 text-center text-slate-400 lg:p-8"
            >
              Las predicciones cerraron al iniciar este partido.
            </div>
          </template>
        </div>

        <aside class="mt-6 space-y-6 md:mt-0">
          <section v-if="goals.length" class="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-5">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Goles</h2>
            <ul class="space-y-2 text-sm">
              <li
                v-for="goal in goals"
                :key="goal.id"
                class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-slate-300"
              >
                <span>{{ goal.teams?.name ?? 'Equipo' }}</span>
                <span class="font-semibold tabular-nums text-mundial-accent">
                  {{ formatGoalEventTime(goal.minute, goal.extra_time, goal.event_second ?? 0) }}
                </span>
              </li>
            </ul>
          </section>

          <section
            v-if="match.status === 'finished'"
            class="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-5"
          >
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Top del partido</h2>
            <p
              v-if="!hasVerifiedWinner"
              class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
            >
              Sin ganador: aún no hay participantes con depósito verificado.
            </p>
            <ol v-else class="space-y-2">
              <li
                v-for="(entry, index) in matchRanking"
                :key="entry.user_id"
                class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <span class="w-5 text-sm text-slate-500">{{ index + 1 }}</span>
                <span class="flex-1 text-sm">{{ entry.profiles?.username ?? 'Anónimo' }}</span>
                <span class="font-bold tabular-nums text-mundial-accent">{{ entry.points }}</span>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
