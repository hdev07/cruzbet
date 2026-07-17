<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseRoundPredictionsMatrix from '@/components/ranking/BaseRoundPredictionsMatrix.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import PaymentStatusChip from '@/components/shared/PaymentStatusChip.vue'
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
  previousWinnerUserIds?: string[]
}>()

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
/** La tabla comparativa es lo principal; el listado de puntos es secundario. */
const activeTab = ref<'predictions' | 'standings'>('predictions')

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
    <div
      v-if="!standingsOnly"
      class="theme-tab-bar mb-4 flex gap-1"
    >
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-xs font-medium transition sm:text-sm"
        :class="activeTab === 'predictions' ? 'bg-mundial-accent text-mundial-dark' : 'text-slate-400'"
        @click="activeTab = 'predictions'"
      >
        Tabla comparativa
      </button>
      <button
        type="button"
        class="flex-1 rounded-md py-2 text-xs font-medium transition sm:text-sm"
        :class="activeTab === 'standings' ? 'bg-mundial-accent text-mundial-dark' : 'text-slate-400'"
        @click="activeTab = 'standings'"
      >
        Por aciertos
      </button>
    </div>

    <DataSkeleton
      v-if="activeTab === 'predictions' && !standingsOnly && loading"
      variant="matrix"
      :rows="6"
    />

    <BaseRoundPredictionsMatrix
      v-else-if="activeTab === 'predictions' && !standingsOnly"
      :round-id="roundId"
      :round-matches="roundMatches"
      :current-user-id="auth.user?.id"
      :previous-winner-user-ids="previousWinnerUserIds"
    />

    <template v-else>
      <p class="mb-4 text-xs text-slate-500">
        Solo participantes con {{ requiredMatches === 1 ? 'el partido marcado' : `los ${requiredMatches} partidos marcados` }}.
        El pozo solo cuenta depósitos verificados.
      </p>

      <DataSkeleton
        v-if="loading || !isLeaderboardReady"
        variant="list"
        :rows="6"
      />

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
            'border border-mundial-accent/40 bg-mundial-accent/15':
              player.user_id === auth.user?.id,
            'opacity-80': !player.verified && player.user_id !== auth.user?.id,
          }"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="index < 3 && player.verified ? 'bg-mundial-accent text-mundial-dark' : 'theme-cell-pending text-slate-400'"
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

          <div class="min-w-0 flex-1">
            <p
              class="truncate font-medium"
              :class="player.user_id === auth.user?.id ? 'text-mundial-accent' : 'text-app-text'"
            >
              {{ player.username ?? 'Anónimo' }}
              <span
                v-if="player.entry_number > 1"
                class="ml-1 text-xs text-slate-500"
              >
                Q{{ player.entry_number }}
              </span>
              <span
                v-if="player.user_id === auth.user?.id"
                class="ml-1 text-xs text-mundial-accent"
              >
                (tú)
              </span>
            </p>
            <PaymentStatusChip class="mt-1" :verified="player.verified" compact />
          </div>

          <div class="text-right">
            <p class="text-lg font-bold tabular-nums text-mundial-accent">
              {{ player.correct_count }} aciertos
            </p>
            <p class="text-xs text-slate-500">{{ player.total_points }} pts</p>
          </div>
        </li>
      </ol>
    </template>
  </div>
</template>
