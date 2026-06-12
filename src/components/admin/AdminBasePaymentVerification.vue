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
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import { BASE_ENTRY_FEE_MXN, BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import { winnerCode } from '@/lib/baseQuinielaDisplay'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BasePrediction, BaseQuinielaRound, BaseQuinielaRoundMatch, BaseRoundParticipant } from '@/types'

const props = defineProps<{
  round: BaseQuinielaRound
  roundMatches: BaseQuinielaRoundMatch[]
  mobile?: boolean
}>()

type PaymentFilter = 'all' | 'verified' | 'pending'
type SortKey = 'username' | 'points' | 'predictions' | 'status'

const baseStore = useBaseQuinielaStore()
const participants = ref<BaseRoundParticipant[]>([])
const loading = ref(false)
const togglingUserId = ref<string | null>(null)
const resettingUserId = ref<string | null>(null)
const resetTarget = ref<BaseRoundParticipant | null>(null)
const error = ref('')
const userSearch = ref('')
const paymentFilter = ref<PaymentFilter>('pending')
const sortKey = ref<SortKey>('status')
const expandedUserId = ref<string | null>(null)

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
    participants.value = await baseStore.fetchRoundParticipants(props.round.id)
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
  return {
    total,
    verified,
    pending: total - verified,
    pool: verified * BASE_ENTRY_FEE_MXN,
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

function predictionDetail(pred: BasePrediction): string {
  const rm = props.roundMatches.find((m) => m.match_id === pred.match_id)
  const pos = rm?.position ?? '?'
  const home = rm?.match ? teamDisplayName(rm.match.home_team, 'L') : 'Local'
  const away = rm?.match ? teamDisplayName(rm.match.away_team, 'V') : 'Visita'
  const code = winnerCode(pred.predicted_winner)
  const pts = pred.scored_at ? ` · ${pred.points} pts` : ''
  return `#${pos} ${home} vs ${away}: ${code}${pts}`
}

function toggleExpanded(userId: string) {
  expandedUserId.value = expandedUserId.value === userId ? null : userId
}

async function toggleVerified(participant: BaseRoundParticipant) {
  togglingUserId.value = participant.user_id
  error.value = ''
  try {
    await baseStore.setPaymentVerified(
      participant.user_id,
      props.round.id,
      !participant.verified,
    )
    await loadParticipants()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al actualizar depósito'
  } finally {
    togglingUserId.value = null
  }
}

function askResetQuiniela(participant: BaseRoundParticipant) {
  resetTarget.value = participant
}

function cancelResetQuiniela() {
  if (resettingUserId.value) return
  resetTarget.value = null
}

async function confirmResetQuiniela() {
  if (!resetTarget.value) return
  const participant = resetTarget.value
  resettingUserId.value = participant.user_id
  error.value = ''
  try {
    await baseStore.resetPlayerQuiniela(participant.user_id, props.round.id)
    if (expandedUserId.value === participant.user_id) {
      expandedUserId.value = null
    }
    resetTarget.value = null
    await loadParticipants()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al reestablecer quiniela'
  } finally {
    resettingUserId.value = null
  }
}
</script>

<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden"
    :class="
      mobile
        ? 'rounded-none border-0 bg-transparent'
        : 'rounded-xl border border-white/10 bg-white/5'
    "
  >
    <header class="shrink-0 space-y-3 border-b border-white/10 pb-3" :class="mobile ? '' : 'px-4 py-3'">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold text-slate-100">Depósitos y quinielas</h2>
        <button
          type="button"
          class="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 md:px-2.5 md:py-1"
          :disabled="loading"
          @click="loadParticipants"
        >
          Actualizar
        </button>
      </div>

      <p class="text-xs text-slate-400">
        <span class="text-slate-200">{{ stats.total }}</span> participantes ·
        <span class="text-mundial-green">{{ stats.verified }}</span> verificados ·
        <span class="text-amber-300">{{ stats.pending }}</span> pendientes ·
        <span class="text-mundial-accent">${{ stats.pool }} MXN</span> bolsa
      </p>

      <p class="text-xs text-slate-500">
        Sin depósito verificado no aparecen en el ranking de la jornada.
      </p>

      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div class="relative min-w-0 flex-1">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            v-model="userSearch"
            type="search"
            placeholder="Buscar usuario..."
            class="w-full rounded-lg border border-white/10 bg-mundial-dark py-3 pl-10 pr-3 text-base md:py-2 md:text-sm"
          />
        </div>

        <div class="flex gap-1.5">
          <button
            v-for="f in ([['all', 'Todos'], ['pending', 'Pend.'], ['verified', 'OK']] as const)"
            :key="f[0]"
            type="button"
            class="flex-1 rounded-lg px-3 py-2.5 text-xs font-medium sm:flex-none sm:px-2.5 sm:py-1.5"
            :class="
              paymentFilter === f[0]
                ? 'bg-mundial-accent text-white'
                : 'bg-white/10 text-slate-300'
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
            class="min-w-0 flex-1 rounded-lg border border-white/10 bg-mundial-dark px-2 py-2.5 text-xs sm:flex-none sm:py-1.5"
          >
            <option value="status">Pendientes primero</option>
            <option value="username">Nombre A-Z</option>
            <option value="points">Más puntos</option>
            <option value="predictions">Más picks</option>
          </select>
        </label>
      </div>
    </header>

    <!-- Vista móvil: tarjetas -->
    <div v-if="mobile" class="app-scrollbar min-h-0 flex-1 overflow-y-auto pt-3">
      <p v-if="loading" class="flex items-center gap-2 py-6 text-sm text-slate-400">
        <Loader2 class="h-4 w-4 animate-spin" />
        Cargando...
      </p>

      <p v-else-if="!participants.length" class="py-6 text-sm text-slate-500">
        Nadie ha registrado predicciones en esta jornada.
      </p>

      <p v-else-if="!filteredParticipants.length" class="py-6 text-sm text-slate-500">
        No hay resultados con los filtros actuales.
      </p>

      <ul v-else class="space-y-3">
        <li
          v-for="participant in filteredParticipants"
          :key="participant.user_id"
          class="rounded-xl border border-white/10 p-4"
          :class="participant.verified ? 'bg-mundial-green/[0.04]' : 'bg-amber-500/[0.04]'"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-slate-100">
                {{ participant.profiles?.username ?? 'Sin nombre' }}
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
                Incompleta ({{ participant.predictions.length }}/{{ BASE_QUINIELA_MATCHES_PER_ROUND }})
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
                :disabled="togglingUserId === participant.user_id || resettingUserId === participant.user_id"
                @click="toggleVerified(participant)"
              >
                <Loader2
                  v-if="togglingUserId === participant.user_id"
                  class="h-4 w-4 animate-spin"
                />
                <CheckCircle2 v-else-if="participant.verified" class="h-4 w-4 shrink-0" />
                <CircleDashed v-else class="h-4 w-4 shrink-0" />
                {{ participant.verified ? 'Pagado' : 'Pendiente' }}
              </button>

              <button
                type="button"
                class="inline-flex min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                :disabled="resettingUserId === participant.user_id || togglingUserId === participant.user_id"
                @click="askResetQuiniela(participant)"
              >
                <Loader2
                  v-if="resettingUserId === participant.user_id"
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
            @click="toggleExpanded(participant.user_id)"
          >
            {{ expandedUserId === participant.user_id ? 'Ocultar detalle' : 'Ver quiniela completa' }}
          </button>

          <p v-if="expandedUserId !== participant.user_id" class="font-mono text-xs leading-relaxed text-slate-300">
            {{ predictionLine(participant) }}
          </p>

          <ul v-else class="space-y-1 text-sm text-slate-300">
            <li
              v-for="pred in sortedPredictions(participant.predictions)"
              :key="pred.id"
              class="leading-snug"
            >
              {{ predictionDetail(pred) }}
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <!-- Vista desktop: tabla -->
    <template v-else>
      <div
        class="grid shrink-0 grid-cols-[100px_1fr_2fr] gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
      >
        <span>Depósito</span>
        <span>Usuario</span>
        <span>Quiniela L/E/V</span>
      </div>

      <div class="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <p v-if="loading" class="flex items-center gap-2 px-4 py-6 text-sm text-slate-400">
          <Loader2 class="h-4 w-4 animate-spin" />
          Cargando...
        </p>

        <p v-else-if="!participants.length" class="px-4 py-6 text-sm text-slate-500">
          Nadie ha registrado predicciones en esta jornada.
        </p>

        <p v-else-if="!filteredParticipants.length" class="px-4 py-6 text-sm text-slate-500">
          No hay resultados con los filtros actuales.
        </p>

        <ul v-else class="divide-y divide-white/5">
          <li
            v-for="participant in filteredParticipants"
            :key="participant.user_id"
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
                :disabled="togglingUserId === participant.user_id || resettingUserId === participant.user_id"
                @click="toggleVerified(participant)"
              >
                <Loader2
                  v-if="togglingUserId === participant.user_id"
                  class="h-3.5 w-3.5 animate-spin"
                />
                <CheckCircle2 v-else-if="participant.verified" class="h-3.5 w-3.5 shrink-0" />
                <CircleDashed v-else class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate">{{ participant.verified ? 'OK' : 'Pend.' }}</span>
              </button>

              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                :disabled="resettingUserId === participant.user_id || togglingUserId === participant.user_id"
                title="Borrar picks y permitir que vuelva a llenar la quiniela"
                @click="askResetQuiniela(participant)"
              >
                <Loader2
                  v-if="resettingUserId === participant.user_id"
                  class="h-3 w-3 animate-spin"
                />
                <RotateCcw v-else class="h-3 w-3 shrink-0" />
                Reset
              </button>
            </div>

            <div class="min-w-0">
              <p class="truncate font-medium text-slate-100">
                {{ participant.profiles?.username ?? 'Sin nombre' }}
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
                @click="toggleExpanded(participant.user_id)"
              >
                {{ expandedUserId === participant.user_id ? 'Resumir' : 'Expandir' }}
              </button>
              <p
                v-if="expandedUserId !== participant.user_id"
                class="font-mono text-xs leading-relaxed text-slate-300"
              >
                {{ predictionLine(participant) }}
              </p>
              <ul v-else class="space-y-0.5 text-sm leading-relaxed text-slate-300">
                <li v-for="pred in sortedPredictions(participant.predictions)" :key="pred.id">
                  {{ predictionDetail(pred) }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <footer
      class="shrink-0 border-t border-white/10 pt-2 text-xs text-slate-500"
      :class="mobile ? 'mt-3' : 'px-4 py-2'"
    >
      {{ filteredParticipants.length }} de {{ participants.length }} participantes
      <span v-if="participants.length && stats.verified === 0">
        · Sin depósitos verificados: no hay ranking oficial
      </span>
    </footer>

    <p
      v-if="error"
      class="shrink-0 border-t border-red-500/20 bg-red-500/10 py-2 text-sm text-red-300"
      :class="mobile ? 'mt-2 rounded-lg px-3' : 'px-4'"
    >
      {{ error }}
    </p>

    <ConfirmModal
      :open="resetTarget != null"
      title="¿Reestablecer quiniela?"
      :subtitle="
        resetTarget
          ? `${resetTarget.profiles?.username ?? 'Este jugador'} perderá todos sus picks de ${round.title}.`
          : undefined
      "
      :bullets="[
        'Se borran todas las predicciones de la jornada.',
        'El jugador podrá volver a marcar y guardar su quiniela.',
        'El estado del depósito (pagado/pendiente) no cambia.',
        'Si ya había puntos en partidos jugados, también se eliminan.',
      ]"
      confirm-label="Sí, reestablecer"
      cancel-label="Cancelar"
      :saving="resettingUserId != null"
      @confirm="confirmResetQuiniela"
      @cancel="cancelResetQuiniela"
    />
  </section>
</template>
