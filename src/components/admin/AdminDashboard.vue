<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowRight,
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
import {
  ADMIN_FEE_SMALL_GROUP_MAX,
  BASE_ENTRY_FEE_MXN,
  type RoundPoolBreakdown,
} from '@/constants/base-quiniela-rules'
import { formatMxn } from '@/lib/formatMoney'

export type AdminPaymentStats = {
  total: number
  submitted: number
  verified: number
  pending: number
  incomplete: number
  pool: number
  poolBreakdown?: RoundPoolBreakdown
}

export type AdminNavigateTarget =
  | { tab: 'jornadas'; focus?: 'pending' | 'users' }
  | { tab: 'partidos'; focus?: 'live' | 'today' }
  | { tab: 'sync' }

const props = defineProps<{
  activeRoundId: string | null
  paymentStats: AdminPaymentStats | null
  liveMatchCount: number
  scheduledTodayCount: number
  loading?: boolean
}>()

const emit = defineEmits<{
  navigate: [target: AdminNavigateTarget]
}>()

const pool = computed(() => props.paymentStats?.poolBreakdown ?? null)

type StatCard = {
  key: string
  label: string
  value: string | number
  icon: typeof Users
  accent: boolean
  accentClass?: string
  raw?: boolean
  hint: string
  target: AdminNavigateTarget | null
}

const statCards = computed<StatCard[]>(() => {
  const stats = props.paymentStats
  return [
    {
      key: 'total',
      label: 'Participantes',
      value: stats?.total ?? 0,
      icon: Users,
      accent: false,
      hint: 'Abrir jornadas y usuarios',
      target: { tab: 'jornadas', focus: 'users' },
    },
    {
      key: 'submitted',
      label: 'Quinielas enviadas',
      value: stats?.submitted ?? 0,
      icon: ClipboardCheck,
      accent: false,
      hint: 'Ver quinielas de la jornada',
      target: { tab: 'jornadas', focus: 'users' },
    },
    {
      key: 'verified',
      label: 'Pagos verificados',
      value: stats?.verified ?? 0,
      icon: CheckCircle2,
      accent: true,
      accentClass: 'text-mundial-green',
      hint: 'Ir a verificación de pagos',
      target: { tab: 'jornadas', focus: 'users' },
    },
    {
      key: 'pending',
      label: 'Pagos pendientes',
      value: stats?.pending ?? 0,
      icon: CircleDashed,
      accent: true,
      accentClass: 'text-amber-300',
      hint: 'Revisar pendientes de pago',
      target: { tab: 'jornadas', focus: 'pending' },
    },
    {
      key: 'pool',
      label: 'En el pozo',
      value: pool.value ? formatMxn(pool.value.net) : '$0 MXN',
      icon: DollarSign,
      accent: true,
      accentClass: 'text-mundial-accent',
      raw: true,
      hint: 'Detalle de pozo y usuarios',
      target: { tab: 'jornadas', focus: 'users' },
    },
    {
      key: 'live',
      label: 'Partidos en vivo',
      value: props.liveMatchCount,
      icon: Radio,
      accent: props.liveMatchCount > 0,
      accentClass: 'text-mundial-green',
      hint: 'Controlar partidos en vivo',
      target: { tab: 'partidos', focus: 'live' },
    },
    {
      key: 'today',
      label: 'Programados hoy',
      value: props.scheduledTodayCount,
      icon: CalendarDays,
      accent: false,
      hint: 'Ver partidos de hoy',
      target: { tab: 'partidos', focus: 'today' },
    },
  ]
})

const shortcuts = computed(() => [
  {
    key: 'jornadas',
    title: 'Jornadas',
    description: 'Usuarios, pagos y tabla para compartir',
    target: { tab: 'jornadas', focus: 'users' } as AdminNavigateTarget,
  },
  {
    key: 'partidos',
    title: 'Partidos',
    description: 'Marcador manual, eventos y sync por partido',
    target: {
      tab: 'partidos',
      focus: props.liveMatchCount > 0 ? 'live' : undefined,
    } as AdminNavigateTarget,
  },
  {
    key: 'sync',
    title: 'Sync ESPN',
    description: 'Forzar sync global o pausar automático',
    target: { tab: 'sync' } as AdminNavigateTarget,
  },
])

function formatValue(card: StatCard) {
  if (card.raw) return card.value
  return typeof card.value === 'number' ? card.value.toLocaleString('es-MX') : card.value
}

function onCardClick(card: StatCard) {
  if (!card.target) return
  emit('navigate', card.target)
}
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col gap-4">
    <header class="space-y-1">
      <h2 class="text-lg font-semibold text-app-text">Resumen</h2>
      <p v-if="activeRoundId" class="text-xs text-slate-400">
        Toca una tarjeta para abrir jornadas, partidos o sync
      </p>
      <p v-else class="text-xs text-slate-500">
        Activa una jornada para ver depósitos y participación
      </p>
    </header>

    <div
      v-if="loading"
      class="theme-card flex flex-1 items-center justify-center py-16"
    >
      <Loader2 class="h-6 w-6 animate-spin text-mundial-accent" />
    </div>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="card in statCards"
          :key="card.key"
          type="button"
          class="admin-stat-card group"
          :class="{
            'border-mundial-green/30 bg-mundial-green/5': card.key === 'live' && liveMatchCount > 0,
          }"
          :disabled="!card.target"
          @click="onCardClick(card)"
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
            :class="card.accent ? card.accentClass : 'text-app-text'"
          >
            {{ formatValue(card) }}
          </p>
          <p
            class="mt-2 flex items-center gap-1 text-[11px] text-slate-500 transition group-hover:text-mundial-accent"
          >
            {{ card.hint }}
            <ArrowRight class="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
          </p>
        </button>
      </div>

      <div
        v-if="pool && pool.verifiedCount > 0"
        class="theme-card border-mundial-accent/25 bg-mundial-accent/10 px-4 py-3 text-xs text-slate-300"
      >
        <p>
          Recaudado {{ formatMxn(pool.gross) }} · comisión {{ pool.feePercent }}%
          ({{ formatMxn(pool.adminFee) }}) ·
          <span class="font-semibold text-mundial-accent">pozo {{ formatMxn(pool.net) }}</span>
        </p>
        <p class="mt-1 text-slate-500">
          5% con hasta {{ ADMIN_FEE_SMALL_GROUP_MAX }} verificados; 10% si hay más.
        </p>
      </div>

      <div
        v-if="paymentStats && paymentStats.incomplete > 0"
        class="theme-card border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
      >
        {{ paymentStats.incomplete.toLocaleString('es-MX') }}
        {{ paymentStats.incomplete === 1 ? 'quiniela incompleta' : 'quinielas incompletas' }}
        sin enviar.
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <button
          v-for="item in shortcuts"
          :key="item.key"
          type="button"
          class="admin-stat-card"
          @click="emit('navigate', item.target)"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-app-text">{{ item.title }}</p>
            <component
              :is="item.key === 'sync' ? RefreshCw : item.key === 'partidos' ? Radio : CalendarDays"
              class="h-4 w-4 text-mundial-accent"
            />
          </div>
          <p class="mt-1 text-xs text-slate-400">{{ item.description }}</p>
          <p class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-mundial-accent">
            Abrir
            <ArrowRight class="h-3.5 w-3.5" />
          </p>
        </button>
      </div>

      <p class="text-xs text-slate-500">
        Entrada ${{ BASE_ENTRY_FEE_MXN }} MXN. El pozo se calcula solo con depósitos verificados.
      </p>
    </template>
  </section>
</template>
