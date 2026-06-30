<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trophy } from '@lucide/vue'
import BaseRoundPredictionsMatrix from '@/components/ranking/BaseRoundPredictionsMatrix.vue'
import { BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseQuinielaRoundMatch } from '@/types'

const props = defineProps<{
  roundId: string
  roundMatches: BaseQuinielaRoundMatch[]
  matchCount?: number
  compact?: boolean
  loading?: boolean
  /** Solo muestra la tabla de posiciones (sin pestaña de pronósticos). */
  standingsOnly?: boolean
  /** Limita filas visibles (p. ej. vista compacta en inicio). */
  maxRows?: number
}>()

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const activeTab = ref<'standings' | 'predictions'>('standings')

const requiredMatches = computed(
  () => props.matchCount ?? (props.roundMatches.length || BASE_QUINIELA_MATCHES_PER_ROUND),
)

const isLeaderboardReady = computed(
  () =>
    !props.loading &&
    baseStore.leaderboardRoundId === props.roundId,
)

const visibleLeaderboard = computed(() => {
  const rows = baseStore.leaderboard
  if (props.maxRows == null || props.maxRows <= 0) return rows
  return rows.slice(0, props.maxRows)
})
</script>

<template>
  <div>
    <div class="mb-3 flex items-center gap-2">
      <Trophy class="h-5 w-5 text-mundial-accent" />
      <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        Ranking de la jornada
      </h2>
    </div>

    <div
      v-if="!standingsOnly"
      class="theme-tab-bar mb-4 flex gap-1"
      :class="compact ? '' : 'lg:max-w-md'"
    >
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-xs font-medium transition sm:text-sm"
        :class="activeTab === 'standings' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
        @click="activeTab = 'standings'"
      >
        Posiciones
      </button>
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-xs font-medium transition sm:text-sm"
        :class="activeTab === 'predictions' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
        @click="activeTab = 'predictions'"
      >
        Pronósticos
      </button>
    </div>

    <template v-if="activeTab === 'standings'">
      <p class="mb-4 text-xs text-slate-500">
        Solo participantes con {{ requiredMatches === 1 ? 'el partido marcado' : `los ${requiredMatches} partidos marcados` }}.
        Orden: más aciertos, luego más puntos; en empate, por nombre.
      </p>

      <p v-if="loading || !isLeaderboardReady" class="text-sm text-slate-400">
        Cargando posiciones...
      </p>

      <div
        v-else-if="!baseStore.leaderboard.length"
        class="rounded-xl border border-dashed border-white/20 p-6 text-center text-slate-400"
      >
        Aún no hay quinielas completas en esta jornada.
      </div>

      <ol v-else class="space-y-2">
        <li
          v-for="(player, index) in visibleLeaderboard"
          :key="`${player.user_id}-${player.entry_number}`"
          class="theme-card flex items-center gap-3 rounded-xl px-4 py-3"
          :class="{
            'ring-1 ring-mundial-accent/50':
              player.user_id === auth.user?.id &&
              player.entry_number === baseStore.currentEntryNumber,
          }"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="index < 3 ? 'bg-mundial-accent text-white' : 'theme-cell-pending text-slate-400'"
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
            class="flex h-10 w-10 items-center justify-center rounded-full theme-cell-pending text-sm font-semibold"
          >
            {{ player.username?.[0]?.toUpperCase() ?? '?' }}
          </span>

          <span class="min-w-0 flex-1 truncate font-medium text-app-text">
            {{ player.username ?? 'Anónimo' }}
            <span
              v-if="player.entry_number > 1"
              class="ml-1 text-xs text-slate-500"
            >
              Q{{ player.entry_number }}
            </span>
            <span
              v-if="
                player.user_id === auth.user?.id &&
                player.entry_number === baseStore.currentEntryNumber
              "
              class="ml-1 text-xs text-mundial-accent"
            >
              (tú)
            </span>
          </span>

          <div class="text-right">
            <p class="text-lg font-bold tabular-nums text-mundial-accent">
              {{ player.correct_count }} aciertos
            </p>
            <p class="text-xs text-slate-500">{{ player.total_points }} pts</p>
          </div>
        </li>
      </ol>
    </template>

    <BaseRoundPredictionsMatrix
      v-else
      :round-id="roundId"
      :round-matches="roundMatches"
      :current-user-id="auth.user?.id"
    />
  </div>
</template>
