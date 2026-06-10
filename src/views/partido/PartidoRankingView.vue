<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import { QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'
import {
  GLOBAL_WINNER_LOGIC,
  MATCH_WINNER_LOGIC,
  SCORE_SCORING_RULES,
  SCORING_RULES,
} from '@/constants/quiniela-rules'
import { useAuthStore } from '@/stores/authStore'
import { useRankingStore } from '@/stores/rankingStore'

const auth = useAuthStore()
const ranking = useRankingStore()

onMounted(async () => {
  await ranking.fetchGlobalRanking()
  if (auth.user) await auth.fetchProfile(auth.user.id)
})
</script>

<template>
  <div>
    <QuinielaModeBanner />

    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Ranking</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ QUINIELA_MODE_PARTIDO.title }} — puntos acumulados en todos los partidos
    </p>

    <div
      v-if="auth.isLoggedIn && auth.profile"
      class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 lg:max-w-sm"
    >
      <p class="text-xs text-slate-400">Tus puntos</p>
      <p class="text-3xl font-bold text-mundial-accent">{{ auth.profile.points }}</p>
    </div>

    <p v-if="ranking.loading" class="text-slate-400">Cargando ranking...</p>

    <div
      v-else-if="!ranking.leaders.length"
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      Aún no hay puntos. ¡Sé el primero en predecir!
    </div>

    <ol v-else class="mb-8 space-y-2 lg:max-w-2xl">
      <li
        v-for="(player, index) in ranking.leaders"
        :key="player.id"
        class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        :class="{ 'ring-1 ring-mundial-accent/50': player.id === auth.user?.id }"
      >
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          :class="index < 3 ? 'bg-mundial-accent text-white' : 'bg-white/10 text-slate-400'"
        >
          {{ index + 1 }}
        </span>

        <img
          v-if="player.avatar"
          :src="player.avatar"
          :alt="player.username ?? 'Jugador'"
          class="h-10 w-10 rounded-full border border-white/20"
        />
        <span
          v-else
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold"
        >
          {{ player.username?.[0]?.toUpperCase() ?? '?' }}
        </span>

        <span class="flex-1 font-medium">
          {{ player.username ?? 'Anónimo' }}
          <span v-if="player.id === auth.user?.id" class="ml-1 text-xs text-mundial-accent">(tú)</span>
        </span>

        <span class="text-lg font-bold tabular-nums text-mundial-accent">{{ player.points }}</span>
      </li>
    </ol>

    <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-500 lg:text-sm">
      <p class="mb-2 font-semibold text-slate-300">Top por partido</p>
      <p class="mb-4">
        Abre un partido y revisa el <strong class="text-slate-300">Top del partido</strong> al final de la página.
      </p>
      <div class="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <p class="mb-1 font-semibold text-slate-300">{{ MATCH_WINNER_LOGIC.title }}</p>
          <p class="mb-3">{{ MATCH_WINNER_LOGIC.summary }}</p>
          <ul class="space-y-1">
            <li v-for="rule in SCORING_RULES" :key="rule.label">
              {{ rule.label }}: <strong class="text-slate-300">{{ rule.points }} pts</strong>
            </li>
          </ul>
        </div>
        <div>
          <p class="mb-1 font-semibold text-slate-300">{{ GLOBAL_WINNER_LOGIC.title }}</p>
          <p class="mb-3">{{ GLOBAL_WINNER_LOGIC.summary }}</p>
          <ul class="space-y-1">
            <li v-for="rule in SCORE_SCORING_RULES" :key="rule.label">
              {{ rule.label }}: <strong class="text-slate-300">{{ rule.points }} pts</strong>
            </li>
          </ul>
        </div>
      </div>
      <RouterLink
        to="/quiniela-partido/reglas"
        class="mt-4 inline-flex items-center gap-1 text-mundial-accent hover:underline"
      >
        Ver reglas completas
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>
  </div>
</template>
