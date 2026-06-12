<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import { BASE_QUINIELA_LOGIC } from '@/constants/base-quiniela-rules'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useRankingStore } from '@/stores/rankingStore'
import { GLOBAL_WINNER_LOGIC, MATCH_WINNER_LOGIC, SCORE_SCORING_RULES, SCORING_RULES } from '@/constants/quiniela-rules'

const auth = useAuthStore()
const ranking = useRankingStore()
const baseStore = useBaseQuinielaStore()
const activeTab = ref<'global' | 'match' | 'base'>('global')

onMounted(async () => {
  await Promise.all([ranking.fetchGlobalRanking(), baseStore.fetchRounds()])
  if (auth.user) await auth.fetchProfile(auth.user.id)
})
</script>

<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Ranking</h1>
    <p class="mb-6 text-sm text-slate-400 lg:text-base">Compite con otros predictores</p>

    <div
      v-if="auth.isLoggedIn && auth.profile"
      class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 lg:max-w-sm lg:p-6"
    >
      <p class="text-xs text-slate-400">Tus puntos</p>
      <p class="text-3xl font-bold text-mundial-accent">{{ auth.profile.points }}</p>
    </div>

    <div class="mb-4 flex gap-2 rounded-lg bg-white/5 p-1 lg:max-w-lg">
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition"
        :class="activeTab === 'global' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
        @click="activeTab = 'global'"
      >
        Global
      </button>
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition"
        :class="activeTab === 'base' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
        @click="activeTab = 'base'"
      >
        Jornadas
      </button>
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition"
        :class="activeTab === 'match' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
        @click="activeTab = 'match'"
      >
        Por partido
      </button>
    </div>

    <template v-if="activeTab === 'global'">
      <p v-if="ranking.loading" class="text-slate-400">Cargando ranking...</p>

      <div
        v-else-if="!ranking.leaders.length"
        class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
      >
        Aún no hay puntos. ¡Sé el primero en predecir!
      </div>

      <ol v-else class="space-y-2 lg:max-w-2xl">
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
    </template>

    <template v-else-if="activeTab === 'base'">
      <p class="mb-4 text-sm text-slate-400">{{ BASE_QUINIELA_LOGIC.summary }}</p>

      <div
        v-if="!baseStore.rounds.length"
        class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
      >
        Aún no hay jornadas.
      </div>

      <div v-else class="space-y-2 lg:max-w-2xl">
        <RouterLink
          v-for="round in baseStore.rounds"
          :key="round.id"
          :to="`/jornadas/${round.id}`"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-mundial-accent/40"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mundial-accent/15 text-sm font-bold text-mundial-accent"
          >
            {{ round.round_number }}
          </span>
          <span class="flex-1 font-medium">{{ round.title }}</span>
          <span class="text-xs text-slate-500">Ver ranking</span>
          <ChevronRight class="h-4 w-4 text-slate-500" />
        </RouterLink>
      </div>

      <RouterLink
        to="/jornadas"
        class="mt-4 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        Ir a las jornadas
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </template>

    <div
      v-else
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      <p class="mb-1 font-semibold text-slate-300">Ranking por partido</p>
      <p class="text-sm">
        Abre un partido en vivo y mira el <strong class="text-slate-300">Top del partido</strong> al final de la página.
      </p>
    </div>

    <div class="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-500 lg:p-6 lg:text-sm">
      <div class="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <p class="mb-1 font-semibold text-slate-300">{{ MATCH_WINNER_LOGIC.title }}</p>
          <p class="mb-3">{{ MATCH_WINNER_LOGIC.summary }}</p>
          <p class="mb-2 font-semibold text-slate-400">Puntos — minuto del primer gol</p>
          <p class="mb-2 text-slate-500">
            Solo minuto exacto o «No habrá goles» (0-0). Regla de 30 s para el minuto efectivo.
          </p>
          <ul class="space-y-1">
            <li v-for="rule in SCORING_RULES" :key="rule.label">
              {{ rule.label }}: <strong class="text-slate-300">{{ rule.points }} pts</strong>
            </li>
          </ul>
        </div>
        <div>
          <p class="mb-1 font-semibold text-slate-300">{{ GLOBAL_WINNER_LOGIC.title }}</p>
          <p class="mb-4">{{ GLOBAL_WINNER_LOGIC.summary }}</p>
          <p class="mb-2 font-semibold text-slate-400">Puntos — ganador (L/E/V)</p>
          <ul class="space-y-1">
            <li v-for="rule in SCORE_SCORING_RULES" :key="rule.label">
              {{ rule.label }}: <strong class="text-slate-300">{{ rule.points }} pts</strong>
            </li>
          </ul>
        </div>
      </div>
      <RouterLink to="/reglas" class="mt-4 inline-flex items-center gap-1 text-mundial-accent hover:underline">
        Ver reglas completas y pagos
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>
  </div>
</template>
