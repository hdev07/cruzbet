<script setup lang="ts">
import { computed } from 'vue'
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  DollarSign,
  Loader2,
  Radio,
  RefreshCw,
  Users,
} from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'

export type AdminPaymentStats = {
  total: number
  submitted: number
  verified: number
  pending: number
  incomplete: number
  pool: number
}

const props = defineProps<{
  activeRoundId: string | null
  paymentStats: AdminPaymentStats | null
  liveMatchCount: number
  scheduledTodayCount: number
  loading?: boolean
}>()

const emit = defineEmits<{
  navigate: [tab: 'jornadas' | 'partidos' | 'sync']
}>()

const statCards = computed(() => {
  const stats = props.paymentStats
  return [
    {
      key: 'total',
      label: 'Participantes',
      value: stats?.total ?? 0,
      icon: Users,
      accent: false,
    },
    {
      key: 'submitted',
      label: 'Quinielas enviadas',
      value: stats?.submitted ?? 0,
      icon: ClipboardCheck,
      accent: false,
    },
    {
      key: 'verified',
      label: 'Pagos verificados',
      value: stats?.verified ?? 0,
      icon: CheckCircle2,
      accent: true,
      accentClass: 'text-mundial-green',
    },
    {
      key: 'pending',
      label: 'Pagos pendientes',
      value: stats?.pending ?? 0,
      icon: CircleDashed,
      accent: true,
      accentClass: 'text-amber-300',
    },
    {
      key: 'pool',
      label: 'Pozo estimado',
      value: stats ? `$${stats.pool.toLocaleString('es-MX')} MXN` : '$0 MXN',
      icon: DollarSign,
      accent: true,
      accentClass: 'text-mundial-accent',
      raw: true,
    },
    {
      key: 'live',
      label: 'Partidos en vivo',
      value: props.liveMatchCount,
      icon: Radio,
      accent: props.liveMatchCount > 0,
      accentClass: 'text-mundial-green',
    },
    {
      key: 'today',
      label: 'Programados hoy',
      value: props.scheduledTodayCount,
      icon: CalendarDays,
      accent: false,
    },
  ]
})

function formatValue(card: (typeof statCards.value)[number]) {
  if (card.raw) return card.value
  return typeof card.value === 'number' ? card.value.toLocaleString('es-MX') : card.value
}
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-5">
    <header class="space-y-1">
      <h2 class="text-lg font-semibold text-slate-100">Resumen</h2>
      <p v-if="activeRoundId" class="text-xs text-slate-400">
        Estadísticas de la jornada activa
      </p>
      <p v-else class="text-xs text-slate-500">
        Selecciona una jornada activa para ver depósitos y participación
      </p>
    </header>

    <div
      v-if="loading"
      class="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 py-16"
    >
      <Loader2 class="h-6 w-6 animate-spin text-mundial-accent" />
    </div>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in statCards"
          :key="card.key"
          class="rounded-xl border border-white/10 bg-white/5 p-4"
          :class="{
            'border-mundial-green/30 bg-mundial-green/5': card.key === 'live' && liveMatchCount > 0,
          }"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
              {{ card.label }}
            </p>
            <component
              :is="card.icon"
              class="h-4 w-4 shrink-0"
              :class="card.accent ? card.accentClass : 'text-slate-500'"
            />
          </div>
          <p
            class="mt-2 text-2xl font-bold tabular-nums"
            :class="card.accent ? card.accentClass : 'text-slate-100'"
          >
            {{ formatValue(card) }}
          </p>
        </article>
      </div>

      <div
        v-if="paymentStats && paymentStats.incomplete > 0"
        class="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90"
      >
        {{ paymentStats.incomplete.toLocaleString('es-MX') }}
        {{ paymentStats.incomplete === 1 ? 'quiniela incompleta' : 'quinielas incompletas' }}
        sin enviar.
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-mundial-accent/40 hover:text-mundial-accent"
          @click="emit('navigate', 'jornadas')"
        >
          Ver pendientes de pago
        </button>
        <button
          type="button"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-mundial-green/40 hover:text-mundial-green"
          :class="{ 'border-mundial-green/30 bg-mundial-green/5': liveMatchCount > 0 }"
          @click="emit('navigate', 'partidos')"
        >
          Partidos en vivo
          <span v-if="liveMatchCount > 0" class="ml-1 tabular-nums text-mundial-green">
            ({{ liveMatchCount }})
          </span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-mundial-accent/40 hover:text-mundial-accent"
          @click="emit('navigate', 'sync')"
        >
          <RefreshCw class="h-4 w-4" />
          Sync ESPN
        </button>
      </div>

      <p class="text-xs text-slate-500">
        Pozo estimado = pagos verificados × ${{ BASE_ENTRY_FEE_MXN }} MXN por quiniela.
      </p>
    </template>
  </section>
</template>
