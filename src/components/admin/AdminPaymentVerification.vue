<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ArrowUpDown,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Search,
} from '@lucide/vue'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import { predictionSummary } from '@/lib/predictionDisplay'
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
  return {
    total,
    verified,
    pending: total - verified,
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
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5">
    <header class="shrink-0 space-y-3 border-b border-white/10 px-4 py-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold text-slate-100">Depósitos y predicciones</h2>
        <button
          type="button"
          class="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5"
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

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative min-w-[160px] flex-1">
          <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            v-model="userSearch"
            type="search"
            placeholder="Buscar usuario..."
            class="w-full rounded-lg border border-white/10 bg-mundial-dark py-2 pl-8 pr-3 text-sm"
          />
        </div>

        <div class="flex gap-1">
          <button
            v-for="f in ([['all', 'Todos'], ['pending', 'Pend.'], ['verified', 'OK']] as const)"
            :key="f[0]"
            type="button"
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium"
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
          <ArrowUpDown class="h-3 w-3" />
          <select
            v-model="sortKey"
            class="rounded-lg border border-white/10 bg-mundial-dark px-2 py-1.5 text-xs"
          >
            <option value="status">Pendientes primero</option>
            <option value="username">Nombre A-Z</option>
            <option value="points">Más puntos</option>
            <option value="predictions">Más predicciones</option>
          </select>
        </label>
      </div>
    </header>

    <div class="grid shrink-0 grid-cols-[100px_1fr_2fr] gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      <span>Depósito</span>
      <span>Usuario</span>
      <span>Predicciones</span>
    </div>

    <div class="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <p v-if="loading" class="flex items-center gap-2 px-4 py-6 text-sm text-slate-400">
        <Loader2 class="h-4 w-4 animate-spin" />
        Cargando...
      </p>

      <p v-else-if="!participants.length" class="px-4 py-6 text-sm text-slate-500">
        Nadie ha registrado predicciones para este partido.
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
          <div>
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold disabled:opacity-50"
              :class="
                participant.verified
                  ? 'border-mundial-green/40 bg-mundial-green/10 text-mundial-green'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              "
              :disabled="togglingUserId === participant.user_id"
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
          </div>

          <div class="min-w-0">
            <p class="truncate font-medium text-slate-100">
              {{ participant.profiles?.username ?? 'Sin nombre' }}
              <span
                v-if="participant.complete === false"
                class="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
              >
                Incompleto
              </span>
            </p>
            <p
              v-if="match.status === 'finished'"
              class="mt-0.5 text-xs font-bold tabular-nums text-mundial-accent"
            >
              {{ participant.total_points }} pts
            </p>
          </div>

          <p class="min-w-0 text-sm leading-relaxed text-slate-300">
            {{ predictionsText(participant) }}
          </p>
        </li>
      </ul>
    </div>

    <footer class="shrink-0 border-t border-white/10 px-4 py-2 text-xs text-slate-500">
      {{ filteredParticipants.length }} de {{ participants.length }} participantes
      <span v-if="match.status === 'finished' && participants.length && stats.verified === 0">
        · Sin depósitos verificados: no hay ganador
      </span>
    </footer>

    <p v-if="error" class="shrink-0 border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      {{ error }}
    </p>
  </section>
</template>
