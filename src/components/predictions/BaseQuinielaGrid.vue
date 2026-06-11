<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckCircle2, Lock, LockOpen, XCircle } from '@lucide/vue'
import { BASE_QUINIELA_FILL_TIP, BASE_QUINIELA_POINTS_PER_HIT } from '@/constants/base-quiniela-rules'
import { BASE_WINNER_OPTIONS, isPredictionCorrect } from '@/lib/baseQuinielaDisplay'
import { formatKickoff, isMatchOpenForPredictions } from '@/lib/matchRules'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseQuinielaRoundMatch, PredictedWinner } from '@/types'

const props = defineProps<{
  roundId: string
  userId?: string
  canPredict?: boolean
  roundMatches: BaseQuinielaRoundMatch[]
}>()

const emit = defineEmits<{
  updated: []
}>()

const baseStore = useBaseQuinielaStore()
const formError = ref<string | null>(null)
const savingMatchId = ref<string | null>(null)
const lockedMatchIds = ref<Set<string>>(new Set())
const justCompleted = ref(false)

const sortedMatches = computed(() =>
  [...props.roundMatches].sort((a, b) => a.position - b.position),
)

const isComplete = computed(() => {
  const total = sortedMatches.value.length
  if (!total) return false
  const filled = sortedMatches.value.filter((row) =>
    baseStore.getPredictionForMatch(row.match_id),
  ).length
  return filled === total
})

function locksStorageKey(): string | null {
  if (!props.userId || !props.roundId) return null
  return `base-quiniela-locks:${props.userId}:${props.roundId}`
}

function loadLocks() {
  const key = locksStorageKey()
  if (!key) {
    lockedMatchIds.value = new Set()
    return
  }
  try {
    const raw = localStorage.getItem(key)
    lockedMatchIds.value = new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    lockedMatchIds.value = new Set()
  }
}

function persistLocks() {
  const key = locksStorageKey()
  if (!key) return
  localStorage.setItem(key, JSON.stringify([...lockedMatchIds.value]))
}

watch(() => [props.userId, props.roundId] as const, loadLocks, { immediate: true })

function isMatchLocked(matchId: string): boolean {
  return lockedMatchIds.value.has(matchId)
}

function canToggleLock(matchId: string): boolean {
  if (!props.canPredict || !props.userId) return false
  if (!baseStore.getPredictionForMatch(matchId)) return false
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  return row?.match ? isMatchOpenForPredictions(row.match) : false
}

function toggleLock(matchId: string) {
  if (!canToggleLock(matchId)) return
  const next = new Set(lockedMatchIds.value)
  if (next.has(matchId)) {
    next.delete(matchId)
  } else {
    next.add(matchId)
  }
  lockedMatchIds.value = next
  persistLocks()
}

function matchCanEdit(matchId: string): boolean {
  if (!props.canPredict || !props.userId) return false
  if (isMatchLocked(matchId)) return false
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  return row?.match ? isMatchOpenForPredictions(row.match) : false
}

async function pickWinner(matchId: string, winner: PredictedWinner) {
  const row = props.roundMatches.find((rm) => rm.match_id === matchId)
  if (!row?.match || !matchCanEdit(matchId) || !props.userId) return

  const filledBefore = sortedMatches.value.filter((r) =>
    baseStore.getPredictionForMatch(r.match_id),
  ).length
  const total = sortedMatches.value.length

  formError.value = null
  savingMatchId.value = matchId
  try {
    await baseStore.savePrediction(props.roundId, row.match, props.userId, winner)
    if (total > 0 && filledBefore === total - 1) {
      justCompleted.value = true
    }
    emit('updated')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo guardar'
  } finally {
    savingMatchId.value = null
  }
}

function cellClass(
  matchId: string,
  winner: PredictedWinner,
  canEdit: boolean,
): string {
  const prediction = baseStore.getPredictionForMatch(matchId)
  const selected = prediction?.predicted_winner === winner
  const base =
    'flex h-full min-h-[2.5rem] w-full items-center justify-center rounded-md border text-sm font-bold transition-colors'

  if (!canEdit) {
    if (selected) {
      return `${base} border-mundial-accent/50 bg-mundial-accent/15 text-mundial-accent`
    }
    return `${base} border-white/5 bg-black/10 text-slate-600`
  }

  if (selected) {
    return `${base} border-mundial-accent bg-mundial-accent/25 text-mundial-accent`
  }

  return `${base} border-white/10 bg-black/20 text-slate-300 hover:border-mundial-accent/40 hover:bg-mundial-accent/10`
}

function mobileCellClass(
  matchId: string,
  winner: PredictedWinner,
  canEdit: boolean,
): string {
  const prediction = baseStore.getPredictionForMatch(matchId)
  const selected = prediction?.predicted_winner === winner
  const base =
    'flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 text-center transition-colors'

  if (!canEdit) {
    if (selected) {
      return `${base} border-mundial-accent/50 bg-mundial-accent/15 text-mundial-accent`
    }
    return `${base} border-white/5 bg-black/10 text-slate-600`
  }

  if (selected) {
    return `${base} border-mundial-accent bg-mundial-accent/25 text-mundial-accent`
  }

  return `${base} border-white/10 bg-black/20 text-slate-300 hover:border-mundial-accent/40 hover:bg-mundial-accent/10`
}

function rowStatusClass(row: BaseQuinielaRoundMatch): string {
  const match = row.match
  const prediction = baseStore.getPredictionForMatch(row.match_id)
  if (!match || !prediction || match.status !== 'finished') return ''

  const correct = isPredictionCorrect(prediction.predicted_winner, match)
  if (correct === true) return 'ring-1 ring-mundial-green/40'
  if (correct === false) return 'ring-1 ring-red-500/30'
  return ''
}

</script>

<template>
  <div>
    <div
      v-if="canPredict && (isComplete || justCompleted)"
      class="mb-4 flex gap-2 rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-3 py-2.5 text-sm text-mundial-green"
    >
      <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p>{{ BASE_QUINIELA_FILL_TIP.allFilled }}</p>
        <p class="mt-1 text-xs text-mundial-green/80">{{ BASE_QUINIELA_FILL_TIP.lockHint }}</p>
      </div>
    </div>

    <p v-if="formError" class="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ formError }}
    </p>

    <!-- Móvil: tarjetas sin scroll horizontal -->
    <div class="space-y-3 md:hidden">
      <article
        v-for="row in sortedMatches"
        :key="`mobile-${row.id}`"
        class="rounded-xl border border-white/10 bg-white/[0.02] p-3"
        :class="rowStatusClass(row)"
      >
        <div v-if="row.match" class="mb-3">
          <div class="mb-1 flex items-center gap-2">
            <button
              v-if="canToggleLock(row.match_id)"
              type="button"
              class="rounded-md p-1 transition-colors"
              :class="
                isMatchLocked(row.match_id)
                  ? 'text-mundial-accent hover:bg-mundial-accent/15'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              "
              :title="
                isMatchLocked(row.match_id)
                  ? 'Desbloquear para editar'
                  : 'Bloquear para evitar cambios'
              "
              @click="toggleLock(row.match_id)"
            >
              <Lock v-if="isMatchLocked(row.match_id)" class="h-3.5 w-3.5" />
              <LockOpen v-else class="h-3.5 w-3.5" />
            </button>
            <span class="text-xs font-semibold tabular-nums text-slate-500">#{{ row.position }}</span>
            <span
              v-if="row.match.status !== 'scheduled'"
              class="ml-auto text-xs font-bold tabular-nums text-mundial-accent"
            >
              {{ row.match.home_score }}-{{ row.match.away_score }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <img
              v-if="row.match.home_team?.flag_url"
              :src="row.match.home_team.flag_url"
              :alt="teamDisplayName(row.match.home_team, 'Local')"
              class="h-4 w-5 shrink-0 rounded object-cover"
            />
            <span class="truncate font-medium text-slate-200">
              {{ teamDisplayName(row.match.home_team, 'Local') }}
            </span>
            <span class="text-slate-500">vs</span>
            <img
              v-if="row.match.away_team?.flag_url"
              :src="row.match.away_team.flag_url"
              :alt="teamDisplayName(row.match.away_team, 'Visitante')"
              class="h-4 w-5 shrink-0 rounded object-cover"
            />
            <span class="truncate font-medium text-slate-200">
              {{ teamDisplayName(row.match.away_team, 'Visitante') }}
            </span>
          </div>

          <p v-if="formatKickoff(row.match)" class="mt-1 text-xs text-slate-500">
            {{ formatKickoff(row.match) }}
          </p>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in BASE_WINNER_OPTIONS"
            :key="`${row.match_id}-mobile-${option.key}`"
            v-show="row.match"
            type="button"
            :class="mobileCellClass(row.match_id, option.key, matchCanEdit(row.match_id))"
            :disabled="baseStore.saving || !matchCanEdit(row.match_id)"
            @click="pickWinner(row.match_id, option.key)"
          >
            <span class="text-xs font-bold uppercase tracking-wide text-mundial-accent/80">
              {{ option.code }}
            </span>
            <span class="text-xs font-semibold leading-tight">
              <template v-if="savingMatchId === row.match_id && baseStore.saving">…</template>
              <template
                v-else-if="baseStore.getPredictionForMatch(row.match_id)?.predicted_winner === option.key"
              >
                ✓ {{ option.label }}
              </template>
              <template v-else>{{ option.label }}</template>
            </span>
          </button>
        </div>

        <div
          v-if="row.match?.status === 'finished' && baseStore.getPredictionForMatch(row.match_id)"
          class="mt-3 flex items-center justify-end gap-1 text-xs"
        >
          <template v-if="baseStore.getPredictionForMatch(row.match_id)?.points">
            <CheckCircle2 class="h-3.5 w-3.5 text-mundial-green" />
            <span class="font-bold text-mundial-green">{{ BASE_QUINIELA_POINTS_PER_HIT }} pts</span>
          </template>
          <template v-else>
            <XCircle class="h-3.5 w-3.5 text-red-400" />
            <span class="text-red-400">0 pts</span>
          </template>
        </div>
      </article>
    </div>

    <!-- Escritorio: tabla -->
    <div class="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-black/40 text-xs uppercase tracking-wider text-slate-400">
            <th
              class="w-8 border border-white/10 px-1 py-2 text-center"
              title="Bloquear fila"
            >
              <Lock class="mx-auto h-3.5 w-3.5" />
            </th>
            <th class="w-8 border border-white/10 px-2 py-2 text-left">#</th>
            <th class="border border-white/10 px-3 py-2 text-left">Partido</th>
            <th
              v-for="option in BASE_WINNER_OPTIONS"
              :key="`head-${option.key}`"
              class="w-24 border border-white/10 px-2 py-2 text-center"
            >
              <span class="block text-sm font-bold text-mundial-accent">{{ option.code }}</span>
              <span class="mt-0.5 block text-[0.65rem] font-normal normal-case text-slate-400">
                {{ option.label }}
              </span>
            </th>
            <th class="w-16 border border-white/10 px-2 py-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedMatches"
            :key="row.id"
            class="bg-white/[0.02]"
            :class="rowStatusClass(row)"
          >
            <td class="border border-white/10 px-1 py-2 text-center">
              <button
                v-if="canToggleLock(row.match_id)"
                type="button"
                class="rounded-md p-1 transition-colors"
                :class="
                  isMatchLocked(row.match_id)
                    ? 'text-mundial-accent hover:bg-mundial-accent/15'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                "
                :title="
                  isMatchLocked(row.match_id)
                    ? 'Desbloquear para editar'
                    : 'Bloquear para evitar cambios'
                "
                @click="toggleLock(row.match_id)"
              >
                <Lock v-if="isMatchLocked(row.match_id)" class="h-3.5 w-3.5" />
                <LockOpen v-else class="h-3.5 w-3.5" />
              </button>
              <span v-else class="text-slate-700">—</span>
            </td>
            <td class="border border-white/10 px-2 py-2 text-center text-slate-500 tabular-nums">
              {{ row.position }}
            </td>
            <td class="border border-white/10 px-3 py-2">
              <div v-if="row.match" class="min-w-0">
                <div class="flex items-center gap-2">
                  <img
                    v-if="row.match.home_team?.flag_url"
                    :src="row.match.home_team.flag_url"
                    :alt="teamDisplayName(row.match.home_team, 'Local')"
                    class="h-4 w-5 shrink-0 rounded object-cover"
                  />
                  <span class="truncate font-medium text-slate-200">
                    {{ teamDisplayName(row.match.home_team, 'Local') }}
                  </span>
                  <span class="text-slate-500">vs</span>
                  <img
                    v-if="row.match.away_team?.flag_url"
                    :src="row.match.away_team.flag_url"
                    :alt="teamDisplayName(row.match.away_team, 'Visitante')"
                    class="h-4 w-5 shrink-0 rounded object-cover"
                  />
                  <span class="truncate font-medium text-slate-200">
                    {{ teamDisplayName(row.match.away_team, 'Visitante') }}
                  </span>
                  <span
                    v-if="row.match.status !== 'scheduled'"
                    class="ml-auto shrink-0 text-xs font-bold tabular-nums text-mundial-accent"
                  >
                    {{ row.match.home_score }}-{{ row.match.away_score }}
                  </span>
                </div>
                <p v-if="formatKickoff(row.match)" class="mt-0.5 text-xs text-slate-500">
                  {{ formatKickoff(row.match) }}
                </p>
              </div>
            </td>
            <td
              v-for="option in BASE_WINNER_OPTIONS"
              :key="`${row.match_id}-${option.key}`"
              class="border border-white/10 p-1"
            >
              <button
                v-if="row.match"
                type="button"
                :class="cellClass(row.match_id, option.key, matchCanEdit(row.match_id))"
                :disabled="baseStore.saving || !matchCanEdit(row.match_id)"
                @click="pickWinner(row.match_id, option.key)"
              >
                <span v-if="savingMatchId === row.match_id && baseStore.saving">…</span>
                <span
                  v-else-if="baseStore.getPredictionForMatch(row.match_id)?.predicted_winner === option.key"
                >
                  ✓
                </span>
                <span v-else class="text-xs">{{ option.label }}</span>
              </button>
            </td>
            <td class="border border-white/10 px-2 py-2 text-center">
              <template v-if="row.match?.status === 'finished'">
                <span
                  v-if="baseStore.getPredictionForMatch(row.match_id)?.points"
                  class="inline-flex items-center gap-0.5 text-xs font-bold text-mundial-green"
                >
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  {{ BASE_QUINIELA_POINTS_PER_HIT }}
                </span>
                <span
                  v-else-if="baseStore.getPredictionForMatch(row.match_id)"
                  class="inline-flex items-center gap-0.5 text-xs text-red-400"
                >
                  <XCircle class="h-3.5 w-3.5" />
                  0
                </span>
                <span v-else class="text-xs text-slate-600">—</span>
              </template>
              <span v-else class="text-xs text-slate-600">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
