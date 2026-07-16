<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Radio,
  RefreshCw,
} from '@lucide/vue'
import AdminBasePaymentVerification from '@/components/admin/AdminBasePaymentVerification.vue'
import AdminBaseRoundList from '@/components/admin/AdminBaseRoundList.vue'
import AdminDashboard from '@/components/admin/AdminDashboard.vue'
import type { AdminPaymentStats } from '@/components/admin/AdminDashboard.vue'
import AdminLiveSyncPanel from '@/components/admin/AdminLiveSyncPanel.vue'
import AdminMatchDetail from '@/components/admin/AdminMatchDetail.vue'
import AdminMatchList from '@/components/admin/AdminMatchList.vue'
import { APP_NAME } from '@/constants/branding'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useMatchStore } from '@/stores/matchStore'

type AdminTab = 'resumen' | 'jornadas' | 'partidos' | 'sync'
type MobileScreen = 'list' | 'detail'

const matchStore = useMatchStore()
const baseStore = useBaseQuinielaStore()

const adminTab = ref<AdminTab>('resumen')
const selectedMatchId = ref('')
const selectedRoundId = ref('')
const search = ref('')
const statusFilter = ref<'all' | 'scheduled' | 'live' | 'finished'>('all')
const onlyWithParticipants = ref(true)
const baseParticipantCounts = ref<Record<string, number>>({})
const paymentStats = ref<AdminPaymentStats | null>(null)
const statsLoading = ref(false)
const mobileScreen = ref<MobileScreen>('list')

const selectedMatch = computed(() =>
  matchStore.matches.find((m) => m.id === selectedMatchId.value),
)

const selectedRound = computed(() =>
  baseStore.rounds.find((r) => r.id === selectedRoundId.value),
)

const liveMatchCount = computed(
  () => matchStore.matches.filter((m) => m.status === 'live').length,
)

const scheduledTodayCount = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  return matchStore.matches.filter((match) => {
    if (match.status !== 'scheduled' || !match.match_date) return false
    const date = new Date(match.match_date)
    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d
  }).length
})

const activeRoundId = computed(() => baseStore.activeRound?.id ?? null)

async function loadBaseParticipantCounts() {
  try {
    baseParticipantCounts.value = await baseStore.fetchParticipantCountsByRound()
  } catch {
    baseParticipantCounts.value = {}
  }
}

async function loadPaymentStats() {
  const roundId = selectedRoundId.value || activeRoundId.value
  if (!roundId) {
    paymentStats.value = null
    return
  }
  statsLoading.value = true
  try {
    paymentStats.value = await baseStore.fetchRoundPaymentStats(roundId)
  } catch {
    paymentStats.value = null
  } finally {
    statsLoading.value = false
  }
}

function autoSelectFirstMatch() {
  if (selectedMatchId.value) return
  const live = matchStore.matches.find((m) => m.status === 'live')
  if (live) {
    selectedMatchId.value = live.id
    return
  }
  if (matchStore.matches.length) {
    selectedMatchId.value = matchStore.matches[0]!.id
  }
}

function autoSelectFirstRound() {
  if (selectedRoundId.value) return
  if (activeRoundId.value) {
    selectedRoundId.value = activeRoundId.value
    return
  }
  const withParticipants = baseStore.rounds.filter(
    (r) => (baseParticipantCounts.value[r.id] ?? 0) > 0,
  )
  if (withParticipants.length) {
    selectedRoundId.value = withParticipants[0]!.id
    return
  }
  if (baseStore.rounds.length) {
    selectedRoundId.value = baseStore.rounds[0]!.id
  }
}

async function loadSelectedRound() {
  if (!selectedRoundId.value) return
  try {
    await baseStore.fetchRound(selectedRoundId.value)
  } catch {
    /* detalle en hijo */
  }
}

function openMatch(matchId: string) {
  selectedMatchId.value = matchId
  mobileScreen.value = 'detail'
}

function openRound(roundId: string) {
  selectedRoundId.value = roundId
  mobileScreen.value = 'detail'
}

function backToList() {
  mobileScreen.value = 'list'
}

function switchTab(tab: AdminTab) {
  adminTab.value = tab
  mobileScreen.value = 'list'
  if (tab === 'partidos') autoSelectFirstMatch()
  if (tab === 'jornadas') autoSelectFirstRound()
  if (tab === 'resumen') void loadPaymentStats()
}

function onDashboardNavigate(tab: 'jornadas' | 'partidos' | 'sync') {
  switchTab(tab)
}

onMounted(async () => {
  await Promise.all([
    matchStore.fetchMatches(),
    baseStore.fetchRounds(),
    loadBaseParticipantCounts(),
  ])
  autoSelectFirstRound()
  autoSelectFirstMatch()
  await loadPaymentStats()
})

watch(
  () => matchStore.matches.length,
  () => autoSelectFirstMatch(),
)

watch(
  () => baseStore.rounds.length,
  () => autoSelectFirstRound(),
)

watch(selectedRoundId, async () => {
  await loadSelectedRound()
  if (adminTab.value === 'resumen') await loadPaymentStats()
})

watch(activeRoundId, async (id) => {
  if (!selectedRoundId.value && id) {
    selectedRoundId.value = id
  }
  if (adminTab.value === 'resumen') await loadPaymentStats()
})
</script>

<template>
  <div
    class="-mx-4 -my-6 flex min-h-[calc(100dvh-3.5rem)] flex-col sm:-mx-0 sm:my-0 md:min-h-[calc(100dvh-4.5rem)]"
  >
    <header class="shrink-0 border-b border-white/10 px-4 py-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-bold text-slate-100">{{ APP_NAME }} — Admin</h1>
          <p class="text-xs text-slate-500">
            Usuarios, pagos y respaldo manual de partidos
          </p>
        </div>
        <nav class="flex flex-wrap rounded-lg border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition"
            :class="adminTab === 'resumen' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
            @click="switchTab('resumen')"
          >
            <BarChart3 class="h-3.5 w-3.5" />
            Resumen
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition"
            :class="adminTab === 'jornadas' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
            @click="switchTab('jornadas')"
          >
            <CalendarDays class="h-3.5 w-3.5" />
            Jornadas
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition"
            :class="adminTab === 'partidos' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
            @click="switchTab('partidos')"
          >
            <Radio class="h-3.5 w-3.5" />
            Partidos
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition"
            :class="adminTab === 'sync' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
            @click="switchTab('sync')"
          >
            <RefreshCw class="h-3.5 w-3.5" />
            Sync
          </button>
        </nav>
      </div>
    </header>

    <!-- ========== RESUMEN ========== -->
    <div v-if="adminTab === 'resumen'" class="app-scrollbar flex-1 overflow-y-auto p-4">
      <AdminDashboard
        :active-round-id="activeRoundId"
        :payment-stats="paymentStats"
        :live-match-count="liveMatchCount"
        :scheduled-today-count="scheduledTodayCount"
        :loading="statsLoading"
        @navigate="onDashboardNavigate"
      />
    </div>

    <!-- ========== JORNADAS ========== -->
    <template v-else-if="adminTab === 'jornadas'">
      <header
        v-if="mobileScreen === 'detail' && selectedRound"
        class="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-mundial-dark/95 backdrop-blur md:hidden"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200"
          @click="backToList"
        >
          <ArrowLeft class="h-4 w-4" />
          Jornadas
        </button>
      </header>

      <div class="hidden min-h-0 flex-1 gap-4 p-4 md:flex">
        <AdminBaseRoundList
          v-model="selectedRoundId"
          v-model:search="search"
          v-model:only-with-participants="onlyWithParticipants"
          class="w-72 shrink-0"
          :participant-counts="baseParticipantCounts"
          @select="openRound"
        />
        <div class="min-h-0 min-w-0 flex-1">
          <AdminBasePaymentVerification
            v-if="selectedRound"
            :round="selectedRound"
            :round-matches="baseStore.roundMatches"
          />
          <p v-else class="p-8 text-center text-sm text-slate-500">
            Selecciona una jornada para ver participantes y pagos.
          </p>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col md:hidden">
        <AdminBaseRoundList
          v-if="mobileScreen === 'list'"
          v-model="selectedRoundId"
          v-model:search="search"
          v-model:only-with-participants="onlyWithParticipants"
          mobile-full-screen
          :participant-counts="baseParticipantCounts"
          @select="openRound"
        />
        <AdminBasePaymentVerification
          v-else-if="selectedRound"
          :round="selectedRound"
          :round-matches="baseStore.roundMatches"
          mobile
        />
      </div>
    </template>

    <!-- ========== PARTIDOS ========== -->
    <template v-else-if="adminTab === 'partidos'">
      <header
        v-if="mobileScreen === 'detail' && selectedMatch"
        class="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-mundial-dark/95 backdrop-blur md:hidden"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200"
          @click="backToList"
        >
          <ArrowLeft class="h-4 w-4" />
          Partidos
        </button>
      </header>

      <div class="hidden min-h-0 flex-1 gap-4 p-4 md:flex">
        <AdminMatchList
          v-model="selectedMatchId"
          v-model:search="search"
          v-model:status-filter="statusFilter"
          class="w-80 shrink-0"
          @select="openMatch"
        />
        <div class="min-h-0 min-w-0 flex-1">
          <AdminMatchDetail v-if="selectedMatch" :match="selectedMatch" />
          <p v-else class="p-8 text-center text-sm text-slate-500">
            Selecciona un partido para control manual y eventos.
          </p>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col md:hidden">
        <AdminMatchList
          v-if="mobileScreen === 'list'"
          v-model="selectedMatchId"
          v-model:search="search"
          v-model:status-filter="statusFilter"
          mobile-full-screen
          @select="openMatch"
        />
        <AdminMatchDetail
          v-else-if="selectedMatch"
          :match="selectedMatch"
          mobile
        />
      </div>
    </template>

    <!-- ========== SYNC ========== -->
    <div v-else class="app-scrollbar flex-1 overflow-y-auto p-4">
      <AdminLiveSyncPanel />
    </div>
  </div>
</template>
