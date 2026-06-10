<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ArrowDownAZ,
  ArrowUpDown,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Search,
} from '@lucide/vue'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import {
  isGoalPrediction,
  isScorePrediction,
  predictionSummary,
} from '@/lib/predictionDisplay'
import { usePredictionStore } from '@/stores/predictionStore'
import type { Match, MatchParticipant } from '@/types'

const props = defineProps<{
  match: Match
}>()

type PaymentFilter = 'all' | 'verified' | 'pending'
type SortKey = 'username' | 'points' | 'predictions' | 'status'

const predictionStore = usePredictionStore()
const participants = ref<MatchParticipant[]>([])
const loading = ref(false)
const togglingUserId = ref<string | null>(null)
const error = ref('')
const userSearch = ref('')
const paymentFilter = ref<PaymentFilter>('pending')
const sortKey = ref<SortKey>('status')

async function loadParticipants() {
  loading.value = true
  error.value = ''
  try {
    participants.value = await predictionStore.fetchMatchParticipants(props.match.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar predicciones'
    participants.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.match.id,
  () => loadParticipants(),
  { immediate: true },
)

const stats = computed(() => {
  const total = participants.value.length
  const verified = participants.value.filter((p) => p.verified).length
  const pending = total - verified
  return {
    total,
    verified,
    pending,
    pool: verified * ENTRY_FEE_MXN,
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

function goalPredictions(participant: MatchParticipant) {
  return participant.predictions.filter(isGoalPrediction)
}

function scorePredictions(participant: MatchParticipant) {
  return participant.predictions.filter(isScorePrediction)
}

function predictionsText(participant: MatchParticipant) {
  return participant.predictions.map((p) => predictionSummary(p, props.match)).join(' · ')
}

async function toggleVerified(participant: MatchParticipant) {
  togglingUserId.value = participant.user_id
  error.value = ''
  try {
    await predictionStore.setPaymentVerified(
      participant.user_id,
      props.match.id,
      !participant.verified,
    )
    await loadParticipants()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al actualizar depósito'
  } finally {
    togglingUserId.value = null
  }
}
</script>

<template>
  <section class="flex h-full min-h-[400px] flex-col rounded-xl border border-white/10 bg-white/5">
    <header class="border-b border-white/10 px-5 py-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-100">Depósitos y predicciones</h2>
          <p class="mt-1 text-sm text-slate-400">
            Verifica transferencias de ${{ ENTRY_FEE_MXN }} MXN. Solo participantes verificados compiten
            por la bolsa del partido.
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          :disabled="loading"
          @click="loadParticipants"
        >
          Actualizar lista
        </button>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-slate-500">Participantes</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-slate-100">{{ stats.total }}</p>
        </div>
        <div class="rounded-lg border border-mundial-green/20 bg-mundial-green/5 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-mundial-green">Verificados</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-mundial-green">{{ stats.verified }}</p>
        </div>
        <div class="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-amber-300">Pendientes</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-amber-200">{{ stats.pending }}</p>
        </div>
        <div class="rounded-lg border border-mundial-accent/20 bg-mundial-accent/5 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-mundial-accent">Bolsa verificada</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-mundial-accent">${{ stats.pool }} MXN</p>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="relative min-w-[220px] flex-1">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            v-model="userSearch"
            type="search"
            placeholder="Buscar por nombre de usuario..."
            class="w-full rounded-lg border border-white/10 bg-mundial-dark py-2.5 pl-9 pr-3 text-sm"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in ([['all', 'Todos'], ['pending', 'Pendientes'], ['verified', 'Verificados']] as const)"
            :key="f[0]"
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-medium"
            :class="
              paymentFilter === f[0]
                ? 'bg-mundial-accent text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            "
            @click="paymentFilter = f[0]"
          >
            {{ f[1] }}
            <span class="ml-1 opacity-70">
              ({{
                f[0] === 'all'
                  ? stats.total
                  : f[0] === 'pending'
                    ? stats.pending
                    : stats.verified
              }})
            </span>
          </button>
        </div>

        <label class="flex items-center gap-2 text-xs text-slate-400">
          <ArrowUpDown class="h-3.5 w-3.5" />
          Ordenar
          <select
            v-model="sortKey"
            class="rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-xs text-slate-200"
          >
            <option value="status">Pendientes primero</option>
            <option value="username">Nombre A-Z</option>
            <option value="points">Más puntos</option>
            <option value="predictions">Más predicciones</option>
          </select>
        </label>
      </div>
    </header>

    <div class="relative flex-1 overflow-auto">
      <p v-if="loading" class="flex items-center gap-2 px-5 py-8 text-sm text-slate-400">
        <Loader2 class="h-4 w-4 animate-spin" />
        Cargando participantes...
      </p>

      <p v-else-if="!participants.length" class="px-5 py-8 text-sm text-slate-500">
        Nadie ha registrado predicciones para este partido.
      </p>

      <p v-else-if="!filteredParticipants.length" class="px-5 py-8 text-sm text-slate-500">
        No hay resultados con los filtros actuales.
      </p>

      <table v-else class="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead class="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wide text-slate-400 backdrop-blur">
          <tr>
            <th class="w-28 border-b border-white/10 px-4 py-3">Depósito</th>
            <th class="min-w-[180px] border-b border-white/10 px-4 py-3">
              <span class="inline-flex items-center gap-1">
                <ArrowDownAZ class="h-3.5 w-3.5" />
                Usuario
              </span>
            </th>
            <th class="w-20 border-b border-white/10 px-4 py-3 text-center">Goles</th>
            <th class="min-w-[220px] border-b border-white/10 px-4 py-3">Predicciones de gol</th>
            <th class="w-24 border-b border-white/10 px-4 py-3 text-center">Marcador</th>
            <th class="min-w-[140px] border-b border-white/10 px-4 py-3">Marcadores</th>
            <th
              v-if="match.status === 'finished'"
              class="w-20 border-b border-white/10 px-4 py-3 text-right"
            >
              Puntos
            </th>
            <th class="min-w-[260px] border-b border-white/10 px-4 py-3">Resumen</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="participant in filteredParticipants"
            :key="participant.user_id"
            class="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
            :class="participant.verified ? 'bg-mundial-green/[0.03]' : 'bg-amber-500/[0.02]'"
          >
            <td class="px-4 py-3 align-top">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                :class="
                  participant.verified
                    ? 'border-mundial-green/40 bg-mundial-green/10 text-mundial-green hover:bg-mundial-green/20'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                "
                :disabled="togglingUserId === participant.user_id"
                @click="toggleVerified(participant)"
              >
                <Loader2
                  v-if="togglingUserId === participant.user_id"
                  class="h-4 w-4 animate-spin"
                />
                <CheckCircle2 v-else-if="participant.verified" class="h-4 w-4" />
                <CircleDashed v-else class="h-4 w-4" />
                {{ participant.verified ? 'Verificado' : 'Pendiente' }}
              </button>
            </td>

            <td class="px-4 py-3 align-top">
              <p class="font-medium text-slate-100">
                {{ participant.profiles?.username ?? 'Sin nombre' }}
              </p>
              <p class="mt-0.5 font-mono text-[11px] text-slate-500">
                {{ participant.user_id.slice(0, 8) }}…
              </p>
            </td>

            <td class="px-4 py-3 text-center align-top tabular-nums text-slate-300">
              {{ goalPredictions(participant).length }}
            </td>

            <td class="px-4 py-3 align-top">
              <p
                v-if="goalPredictions(participant).length"
                class="text-xs leading-relaxed text-slate-300"
                :title="goalPredictions(participant).map((p) => predictionSummary(p, match)).join(', ')"
              >
                {{
                  goalPredictions(participant)
                    .map((p) => predictionSummary(p, match))
                    .join(' · ')
                }}
              </p>
              <span v-else class="text-xs text-slate-600">—</span>
            </td>

            <td class="px-4 py-3 text-center align-top tabular-nums text-slate-300">
              {{ scorePredictions(participant).length }}
            </td>

            <td class="px-4 py-3 align-top">
              <p
                v-if="scorePredictions(participant).length"
                class="text-xs leading-relaxed text-slate-300"
              >
                {{
                  scorePredictions(participant)
                    .map((p) => predictionSummary(p, match))
                    .join(' · ')
                }}
              </p>
              <span v-else class="text-xs text-slate-600">—</span>
            </td>

            <td
              v-if="match.status === 'finished'"
              class="px-4 py-3 text-right align-top font-bold tabular-nums text-mundial-accent"
            >
              {{ participant.total_points }}
            </td>

            <td class="px-4 py-3 align-top">
              <p class="line-clamp-2 text-xs leading-relaxed text-slate-400" :title="predictionsText(participant)">
                {{ predictionsText(participant) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
      Mostrando {{ filteredParticipants.length }} de {{ participants.length }} participantes
      <span v-if="match.status === 'finished' && participants.length && stats.verified === 0">
        · Sin depósitos verificados: no hay ganador
      </span>
    </footer>

    <p v-if="error" class="border-t border-red-500/20 bg-red-500/10 px-5 py-2 text-sm text-red-300">
      {{ error }}
    </p>
  </section>
</template>
