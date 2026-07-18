<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ArrowUpDown,
  CheckCircle2,
  CircleDashed,
  Loader2,
  RotateCcw,
  Search,
} from '@lucide/vue'
import AdminRoundTableExport from '@/components/admin/AdminRoundTableExport.vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import { BASE_ENTRY_FEE_MXN, computeRoundPool } from '@/constants/base-quiniela-rules'
import { formatMxn } from '@/lib/formatMoney'
import { BASE_WINNER_OPTIONS, winnerCode } from '@/lib/baseQuinielaDisplay'
import { formatEntryLabel } from '@/lib/baseQuinielaStats'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type {
  BasePrediction,
  BaseQuinielaRound,
  BaseQuinielaRoundMatch,
  BaseRoundParticipant,
  PredictedWinner,
} from '@/types'

type PaymentFilter = 'all' | 'verified' | 'pending'
type SortKey = 'username' | 'points' | 'predictions' | 'status'

const props = defineProps<{
  round: BaseQuinielaRound
  roundMatches: BaseQuinielaRoundMatch[]
  mobile?: boolean
  focusFilter?: PaymentFilter
}>()

const baseStore = useBaseQuinielaStore()
const participants = ref<BaseRoundParticipant[]>([])
const loading = ref(false)
const togglingKey = ref<string | null>(null)
const resettingKey = ref<string | null>(null)
const savingPickKey = ref<string | null>(null)
const resetTarget = ref<BaseRoundParticipant | null>(null)
const error = ref('')
const userSearch = ref('')
const paymentFilter = ref<PaymentFilter>(props.focusFilter ?? 'all')
const sortKey = ref<SortKey>('username')
const expandedKey = ref<string | null>(null)

watch(
  () => props.focusFilter,
  (value) => {
    if (value) paymentFilter.value = value
  },
)

function participantKey(participant: BaseRoundParticipant): string {
  return `${participant.user_id}:${participant.entry_number}`
}

const positionByMatchId = computed(() => {
  const map = new Map<string, number>()
  for (const rm of props.roundMatches) {
    map.set(rm.match_id, rm.position)
  }
  return map
})

async function loadParticipants() {
  loading.value = true
  error.value = ''
  try {
    participants.value = await baseStore.fetchRoundParticipants(
      props.round.id,
      props.round.match_count,
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar predicciones'
    participants.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.round.id,
  () => loadParticipants(),
  { immediate: true },
)

const stats = computed(() => {
  const total = participants.value.length
  const verified = participants.value.filter((p) => p.verified).length
  const pool = computeRoundPool(verified)
  return {
    total,
    verified,
    pending: total - verified,
    pool,
  }
})

const filteredParticipants = computed(() => {
  const q = userSearch.value.trim().toLowerCase()

  let rows = participants.value.filter((p) => {
    if (paymentFilter.value === 'verified' && !p.verified) return false
    if (paymentFilter.value === 'pending' && p.verified) return false
    if (!q) return true
    const username = p.profiles?.username?.toLowerCase() ?? ''
    return username.includes(q)
  })

  rows = [...rows].sort((a, b) => {
    if (sortKey.value === 'username') {
      const nameA = a.profiles?.username?.toLowerCase() ?? ''
      const nameB = b.profiles?.username?.toLowerCase() ?? ''
      return nameA.localeCompare(nameB, 'es')
    }
    if (sortKey.value === 'points') return b.total_points - a.total_points
    if (sortKey.value === 'predictions') {
      return b.predictions.length - a.predictions.length
    }
    if (a.verified !== b.verified) return a.verified ? 1 : -1
    return b.total_points - a.total_points
  })

  return rows
})

function sortedPredictions(predictions: BasePrediction[]): BasePrediction[] {
  return [...predictions].sort((a, b) => {
    const posA = positionByMatchId.value.get(a.match_id) ?? 99
    const posB = positionByMatchId.value.get(b.match_id) ?? 99
    return posA - posB
  })
}

function predictionLine(participant: BaseRoundParticipant): string {
  return sortedPredictions(participant.predictions)
    .map((p) => {
      const pos = positionByMatchId.value.get(p.match_id) ?? '?'
      return `${pos}${winnerCode(p.predicted_winner)}`
    })
    .join(' ')
}

function toggleExpanded(participant: BaseRoundParticipant) {
  const key = participantKey(participant)
  expandedKey.value = expandedKey.value === key ? null : key
}

async function toggleVerified(participant: BaseRoundParticipant) {
  togglingKey.value = participantKey(participant)
  error.value = ''
  try {
    await baseStore.setPaymentVerified(
      participant.user_id,
      props.round.id,
      !participant.verified,
      participant.entry_number,
    )
    await loadParticipants()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al actualizar depósito'
  } finally {
    togglingKey.value = null
  }
}

function askResetQuiniela(participant: BaseRoundParticipant) {
  resetTarget.value = participant
}

function cancelResetQuiniela() {
  if (resettingKey.value) return
  resetTarget.value = null
}

async function confirmResetQuiniela() {
  if (!resetTarget.value) return
  const participant = resetTarget.value
  resettingKey.value = participantKey(participant)
  error.value = ''
  try {
    await baseStore.resetPlayerQuiniela(
      participant.user_id,
      props.round.id,
      participant.entry_number,
    )
    if (expandedKey.value === participantKey(participant)) {
      expandedKey.value = null
    }
    resetTarget.value = null
    await loadParticipants()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al reestablecer quiniela'
  } finally {
    resettingKey.value = null
  }
}

function pickForMatch(
  participant: BaseRoundParticipant,
  matchId: string,
): BasePrediction | undefined {
  return participant.predictions.find((p) => p.match_id === matchId)
}

function pickSaveKey(
  participant: BaseRoundParticipant,
  matchId: string,
): string {
  return `${participantKey(participant)}:${matchId}`
}

async function adminChangePick(
  participant: BaseRoundParticipant,
  matchId: string,
  winner: PredictedWinner,
) {
  const current = pickForMatch(participant, matchId)
  if (current?.predicted_winner === winner) return

  const key = pickSaveKey(participant, matchId)
  savingPickKey.value = key
  error.value = ''
  try {
    await baseStore.adminSetPrediction(
      participant.user_id,
      props.round.id,
      matchId,
      winner,
      participant.entry_number,
    )
    await loadParticipants()
    expandedKey.value = participantKey(participant)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cambiar el pick'
  } finally {
    savingPickKey.value = null
  }
}

const sortedRoundMatches = computed(() =>
  [...props.roundMatches].sort((a, b) => a.position - b.position),
)
</script>

<template>
  <section class="admin-shell min-h-0 h-full">
    <header class="admin-panel-header space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-semibold text-app-text">Usuarios y quinielas</h2>
        <button
          type="button"
          class="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
          :disabled="loading"
          @click="loadParticipants"
        >
          Actualizar
        </button>
      </div>

      <p class="text-xs text-slate-400">
        <span class="text-app-text">{{ stats.total }}</span> participantes ·
        <span class="text-mundial-green">{{ stats.verified }}</span> verificados ·
        <span class="text-amber-300">{{ stats.pending }}</span> pendientes ·
        <span class="text-mundial-accent">{{ formatMxn(stats.pool.net) }}</span> en el pozo
        <span class="text-slate-500">
          ({{ formatMxn(stats.pool.adminFee) }} infra {{ stats.pool.feePercent }}% ·
          recaudado {{ formatMxn(stats.pool.gross) }})
        </span>
      </p>

      <p class="text-xs text-slate-500">
        Entrada ${{ BASE_ENTRY_FEE_MXN }} MXN. Expande un usuario para cambiar sus picks L/E/V.
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div class="relative min-w-0 flex-1">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            v-model="userSearch"
            type="search"
            placeholder="Buscar usuario..."
            class="theme-field w-full rounded-lg py-2.5 pl-10 pr-3 text-sm"
          />
        </div>

        <div class="theme-tab-bar flex gap-1">
          <button
            v-for="f in ([['all', 'Todos'], ['pending', 'Pend.'], ['verified', 'OK']] as const)"
            :key="f[0]"
            type="button"
            class="flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium sm:flex-none"
            :class="
              paymentFilter === f[0]
                ? 'bg-mundial-accent text-mundial-dark'
                : 'text-slate-300'
            "
            @click="paymentFilter = f[0]"
          >
            {{ f[1] }}
          </button>
        </div>

        <label class="flex items-center gap-1.5 text-xs text-slate-400">
          <ArrowUpDown class="h-3 w-3 shrink-0" />
          <select
            v-model="sortKey"
            class="theme-field min-w-0 flex-1 rounded-lg px-2 py-2 text-xs sm:flex-none"
          >
            <option value="status">Pendientes primero</option>
            <option value="username">Nombre A-Z</option>
            <option value="points">Más puntos</option>
            <option value="predictions">Más picks</option>
          </select>
        </label>
      </div>
    </header>

    <div class="shrink-0 border-b border-app-border">
      <div class="app-scrollbar overflow-x-auto p-4">
        <AdminRoundTableExport :round="round" :round-matches="roundMatches" />
      </div>
    </div>

    <!-- Vista móvil: tarjetas -->
    <div v-if="mobile" class="app-scrollbar admin-panel-body">
      <div v-if="loading" class="py-2">
        <DataSkeleton variant="list" :rows="5" />
      </div>

      <p v-else-if="!participants.length" class="admin-empty">
        Nadie ha registrado predicciones en esta jornada.
      </p>

      <p v-else-if="!filteredParticipants.length" class="admin-empty">
        No hay resultados con los filtros actuales.
      </p>

      <ul v-else class="space-y-3">
        <li
          v-for="participant in filteredParticipants"
          :key="participantKey(participant)"
          class="rounded-xl border border-white/10 p-3"
          :class="participant.verified ? 'bg-mundial-green/[0.04]' : 'bg-amber-500/[0.04]'"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-slate-100">
                {{ participant.profiles?.username ?? 'Sin nombre' }}
                <span class="ml-1 text-xs font-normal text-slate-500">
                  · {{ formatEntryLabel(participant.entry_number, participant.entry_name) }}
                </span>
              </p>
              <p class="mt-0.5 text-sm tabular-nums text-slate-400">
                {{ participant.predictions.length }}/{{ round.match_count }} picks
                <span v-if="participant.total_points > 0" class="font-bold text-mundial-accent">
                  · {{ participant.correct_count }} aciertos ({{ participant.total_points }} pts)
                </span>
              </p>
              <span
                v-if="!participant.complete"
                class="mt-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
              >
                Incompleta ({{ participant.predictions.length }}/{{ round.match_count }})
              </span>
            </div>

            <div class="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                class="inline-flex min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold disabled:opacity-50"
                :class="
                  participant.verified
                    ? 'border-mundial-green/40 bg-mundial-green/10 text-mundial-green'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                "
                :disabled="togglingKey === participantKey(participant) || resettingKey === participantKey(participant)"
                @click="toggleVerified(participant)"
              >
                <Loader2
                  v-if="togglingKey === participantKey(participant)"
                  class="h-4 w-4 animate-spin"
                />
                <CheckCircle2 v-else-if="participant.verified" class="h-4 w-4 shrink-0" />
                <CircleDashed v-else class="h-4 w-4 shrink-0" />
                {{ participant.verified ? 'Pagado' : 'Pendiente' }}
              </button>

              <button
                type="button"
                class="inline-flex min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                :disabled="resettingKey === participantKey(participant) || togglingKey === participantKey(participant)"
                @click="askResetQuiniela(participant)"
              >
                <Loader2
                  v-if="resettingKey === participantKey(participant)"
                  class="h-3.5 w-3.5 animate-spin"
                />
                <RotateCcw v-else class="h-3.5 w-3.5 shrink-0" />
                Reestablecer
              </button>
            </div>
          </div>

          <button
            type="button"
            class="mb-2 text-xs font-medium text-mundial-accent hover:underline"
            @click="toggleExpanded(participant)"
          >
            {{ expandedKey === participantKey(participant) ? 'Ocultar detalle' : 'Editar quiniela' }}
          </button>

          <p v-if="expandedKey !== participantKey(participant)" class="font-mono text-xs leading-relaxed text-slate-300">
            {{ predictionLine(participant) || 'Sin picks aún' }}
          </p>

          <ul v-else class="space-y-3">
            <li
              v-for="rm in sortedRoundMatches"
              :key="`${participantKey(participant)}-m-${rm.match_id}`"
              class="rounded-lg border border-white/10 bg-black/20 p-2.5"
            >
              <p class="mb-2 text-xs text-slate-400">
                <span class="font-semibold text-slate-300">#{{ rm.position }}</span>
                <template v-if="rm.match">
                  {{ teamDisplayName(rm.match.home_team, 'L') }} vs
                  {{ teamDisplayName(rm.match.away_team, 'V') }}
                </template>
              </p>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="option in BASE_WINNER_OPTIONS"
                  :key="`${participantKey(participant)}-${rm.match_id}-${option.key}`"
                  type="button"
                  class="rounded-md border px-2 py-2 text-xs font-bold disabled:opacity-50"
                  :class="
                    pickForMatch(participant, rm.match_id)?.predicted_winner === option.key
                      ? 'border-mundial-accent bg-mundial-accent/25 text-mundial-accent'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  "
                  :disabled="
                    savingPickKey === pickSaveKey(participant, rm.match_id) ||
                    resettingKey === participantKey(participant)
                  "
                  @click="adminChangePick(participant, rm.match_id, option.key)"
                >
                  {{ option.code }}
                </button>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <!-- Vista desktop: tabla -->
    <template v-else>
      <div
        class="theme-table-head grid shrink-0 grid-cols-[100px_1fr_2fr] gap-3 border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
      >
        <span>Depósito</span>
        <span>Usuario</span>
        <span>Quiniela L/E/V</span>
      </div>

      <div class="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div v-if="loading" class="px-4 py-3">
          <DataSkeleton variant="table" :rows="8" />
        </div>

        <p v-else-if="!participants.length" class="admin-empty">
          Nadie ha registrado predicciones en esta jornada.
        </p>

        <p v-else-if="!filteredParticipants.length" class="admin-empty">
          No hay resultados con los filtros actuales.
        </p>

        <ul v-else class="divide-y divide-white/5">
          <li
            v-for="participant in filteredParticipants"
            :key="participantKey(participant)"
            class="grid grid-cols-[100px_1fr_2fr] items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
            :class="participant.verified ? 'bg-mundial-green/[0.03]' : 'bg-amber-500/[0.02]'"
          >
            <div class="space-y-1.5">
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                :class="
                  participant.verified
                    ? 'border-mundial-green/40 bg-mundial-green/10 text-mundial-green'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                "
                :disabled="togglingKey === participantKey(participant) || resettingKey === participantKey(participant)"
                @click="toggleVerified(participant)"
              >
                <Loader2
                  v-if="togglingKey === participantKey(participant)"
                  class="h-3.5 w-3.5 animate-spin"
                />
                <CheckCircle2 v-else-if="participant.verified" class="h-3.5 w-3.5 shrink-0" />
                <CircleDashed v-else class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate">{{ participant.verified ? 'OK' : 'Pend.' }}</span>
              </button>

              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                :disabled="resettingKey === participantKey(participant) || togglingKey === participantKey(participant)"
                title="Borrar picks y permitir que vuelva a llenar la quiniela"
                @click="askResetQuiniela(participant)"
              >
                <Loader2
                  v-if="resettingKey === participantKey(participant)"
                  class="h-3 w-3 animate-spin"
                />
                <RotateCcw v-else class="h-3 w-3 shrink-0" />
                Reset
              </button>
            </div>

            <div class="min-w-0">
              <p class="truncate font-medium text-slate-100">
                {{ participant.profiles?.username ?? 'Sin nombre' }}
                <span class="ml-1 text-xs font-normal text-slate-500">
                  · {{ formatEntryLabel(participant.entry_number, participant.entry_name) }}
                </span>
                <span
                  v-if="!participant.complete"
                  class="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
                >
                  {{ participant.predictions.length }}/{{ round.match_count }}
                </span>
              </p>
              <p
                v-if="participant.total_points > 0"
                class="mt-0.5 text-xs font-bold tabular-nums text-mundial-accent"
              >
                {{ participant.correct_count }} aciertos · {{ participant.total_points }} pts
              </p>
            </div>

            <div class="min-w-0">
              <button
                type="button"
                class="mb-1 text-[11px] font-medium text-mundial-accent hover:underline"
                @click="toggleExpanded(participant)"
              >
                {{ expandedKey === participantKey(participant) ? 'Cerrar editor' : 'Editar picks' }}
              </button>
              <p
                v-if="expandedKey !== participantKey(participant)"
                class="font-mono text-xs leading-relaxed text-slate-300"
              >
                {{ predictionLine(participant) || 'Sin picks aún' }}
              </p>
              <ul v-else class="space-y-2">
                <li
                  v-for="rm in sortedRoundMatches"
                  :key="`desk-${participantKey(participant)}-${rm.match_id}`"
                  class="rounded-lg border border-white/10 bg-black/15 px-2 py-2"
                >
                  <p class="mb-1.5 text-[11px] text-slate-400">
                    <span class="font-semibold text-slate-300">#{{ rm.position }}</span>
                    <template v-if="rm.match">
                      {{ teamDisplayName(rm.match.home_team, 'L') }} vs
                      {{ teamDisplayName(rm.match.away_team, 'V') }}
                    </template>
                  </p>
                  <div class="flex gap-1">
                    <button
                      v-for="option in BASE_WINNER_OPTIONS"
                      :key="`desk-${participantKey(participant)}-${rm.match_id}-${option.key}`"
                      type="button"
                      class="min-w-[2.25rem] flex-1 rounded border px-1.5 py-1 text-[11px] font-bold disabled:opacity-50"
                      :class="
                        pickForMatch(participant, rm.match_id)?.predicted_winner === option.key
                          ? 'border-mundial-accent bg-mundial-accent/25 text-mundial-accent'
                          : 'border-white/10 bg-white/5 text-slate-300'
                      "
                      :disabled="
                        savingPickKey === pickSaveKey(participant, rm.match_id) ||
                        resettingKey === participantKey(participant)
                      "
                      @click="adminChangePick(participant, rm.match_id, option.key)"
                    >
                      {{ option.code }}
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <footer class="admin-panel-footer text-xs text-slate-500">
      {{ filteredParticipants.length }} de {{ participants.length }} participantes
      <span v-if="participants.length && stats.verified === 0">
        · Sin depósitos verificados: no hay ranking oficial
      </span>
    </footer>

    <p
      v-if="error"
      class="admin-panel-footer border-t border-red-500/20 bg-red-500/10 text-sm text-red-300"
    >
      {{ error }}
    </p>

    <ConfirmModal
      :open="resetTarget != null"
      title="¿Reestablecer quiniela?"
      :subtitle="
        resetTarget
          ? `${resetTarget.profiles?.username ?? 'Este jugador'} perderá todos sus picks de ${formatEntryLabel(resetTarget.entry_number, resetTarget.entry_name)} en ${round.title}.`
          : undefined
      "
      :bullets="[
        'Se borran todas las predicciones de esa quiniela.',
        'El jugador podrá volver a marcar y guardar su quiniela.',
        'El estado del depósito (pagado/pendiente) no cambia.',
        'Si ya había puntos en partidos jugados, también se eliminan.',
      ]"
      confirm-label="Sí, reestablecer"
      cancel-label="Cancelar"
      :saving="resettingKey != null"
      @confirm="confirmResetQuiniela"
      @cancel="cancelResetQuiniela"
    />
  </section>
</template>
