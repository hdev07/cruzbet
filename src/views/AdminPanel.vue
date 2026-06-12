<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, CalendarDays, Radio } from '@lucide/vue'
import AdminBasePaymentVerification from '@/components/admin/AdminBasePaymentVerification.vue'
import AdminBaseRoundList from '@/components/admin/AdminBaseRoundList.vue'
import AdminLiveSyncPanel from '@/components/admin/AdminLiveSyncPanel.vue'
import AdminMatchDetail from '@/components/admin/AdminMatchDetail.vue'
import AdminMatchList from '@/components/admin/AdminMatchList.vue'
import { APP_NAME } from '@/constants/branding'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useMatchStore } from '@/stores/matchStore'
import { usePredictionStore } from '@/stores/predictionStore'

type AdminMode = 'partidos' | 'jornadas'
type MobileScreen = 'list' | 'detail'

const matchStore = useMatchStore()
const predictionStore = usePredictionStore()
const baseStore = useBaseQuinielaStore()

const adminMode = ref<AdminMode>('partidos')
const selectedMatchId = ref('')
const selectedRoundId = ref('')
const search = ref('')
const statusFilter = ref<'all' | 'scheduled' | 'live' | 'finished'>('all')
const onlyWithParticipants = ref(false)
const participantCounts = ref<Record<string, number>>({})
const baseParticipantCounts = ref<Record<string, number>>({})

const mobileScreen = ref<MobileScreen>('list')

const selectedMatch = computed(() =>
  matchStore.matches.find((m) => m.id === selectedMatchId.value),
)

const selectedRound = computed(() =>
  baseStore.rounds.find((r) => r.id === selectedRoundId.value),
)

async function loadParticipantCounts() {
  try {
    participantCounts.value = await predictionStore.fetchParticipantCountsByMatch()
  } catch {
    participantCounts.value = {}
  }
}

async function loadBaseParticipantCounts() {
  try {
    baseParticipantCounts.value = await baseStore.fetchParticipantCountsByRound()
  } catch {
    baseParticipantCounts.value = {}
  }
}

function autoSelectFirstMatch() {
  if (selectedMatchId.value || adminMode.value !== 'partidos') return
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
  if (selectedRoundId.value || adminMode.value !== 'jornadas') return
  const withParticipants = baseStore.rounds.filter((r) => (baseParticipantCounts.value[r.id] ?? 0) > 0)
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

function switchMode(mode: AdminMode) {
  adminMode.value = mode
  mobileScreen.value = 'list'
  if (mode === 'partidos') autoSelectFirstMatch()
  else autoSelectFirstRound()
}

onMounted(async () => {
  await Promise.all([
    matchStore.fetchMatches(),
    baseStore.fetchRounds(),
    loadParticipantCounts(),
    loadBaseParticipantCounts(),
  ])
  autoSelectFirstMatch()
})

watch(
  () => matchStore.matches.length,
  () => autoSelectFirstMatch(),
)

watch(
  () => baseStore.rounds.length,
  () => autoSelectFirstRound(),
)

watch(selectedRoundId, () => loadSelectedRound(), { immediate: true })
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
            Partidos en vivo, goles y pagos de jornadas
          </p>
        </div>
        <nav class="flex rounded-lg border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition"
            :class="adminMode === 'partidos' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
            @click="switchMode('partidos')"
          >
            <Radio class="h-3.5 w-3.5" />
            Partidos
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition"
            :class="adminMode === 'jornadas' ? 'bg-mundial-accent text-white' : 'text-slate-400'"
            @click="switchMode('jornadas')"
          >
            <CalendarDays class="h-3.5 w-3.5" />
            Jornadas
          </button>
        </nav>
      </div>
    </header>

    <!-- ========== PARTIDOS ========== -->
    <template v-if="adminMode === 'partidos'">
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
        <p class="px-4 pb-3 text-center text-sm font-semibold text-slate-200">
          {{ teamDisplayName(selectedMatch.home_team, 'Local') }}
          vs
          {{ teamDisplayName(selectedMatch.away_team, 'Visita') }}
        </p>
      </header>

      <div v-show="mobileScreen === 'list'" class="shrink-0 px-4 py-3 md:px-0">
        <AdminLiveSyncPanel />
      </div>

      <AdminMatchList
        v-show="mobileScreen === 'list'"
        v-model="selectedMatchId"
        v-model:search="search"
        v-model:status-filter="statusFilter"
        v-model:only-with-participants="onlyWithParticipants"
        :participant-counts="participantCounts"
        mobile-full-screen
        class="min-h-0 flex-1 md:hidden"
        @select="openMatch"
      />

      <div v-if="selectedMatch && mobileScreen === 'detail'" class="flex min-h-0 flex-1 flex-col md:hidden">
        <AdminMatchDetail :match="selectedMatch" mobile />
      </div>

      <div class="hidden min-h-0 flex-1 flex-col gap-3 md:flex">
        <AdminLiveSyncPanel />

        <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <AdminMatchList
            v-model="selectedMatchId"
            v-model:search="search"
            v-model:status-filter="statusFilter"
            v-model:only-with-participants="onlyWithParticipants"
            :participant-counts="participantCounts"
            class="min-h-[360px] lg:min-h-0"
          />

          <AdminMatchDetail v-if="selectedMatch" :match="selectedMatch" class="min-h-0" />

          <div
            v-else
            class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 p-8"
          >
            <p class="text-slate-500">Selecciona un partido para controlarlo</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== JORNADAS ========== -->
    <template v-else>
      <header
        v-if="mobileScreen === 'list'"
        class="shrink-0 border-b border-white/10 px-4 py-2 md:hidden"
      >
        <p class="text-xs text-slate-500">Verifica depósitos y quinielas por jornada</p>
      </header>

      <header
        v-else-if="selectedRound"
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
        <div class="px-4 pb-3 text-center">
          <p class="text-lg font-bold text-slate-100">{{ selectedRound.title }}</p>
          <p class="mt-1 text-xs text-slate-500">
            Jornada {{ selectedRound.round_number }} · {{ selectedRound.match_count }} partidos ·
            ${{ BASE_ENTRY_FEE_MXN }} MXN
          </p>
        </div>
      </header>

      <AdminBaseRoundList
        v-show="mobileScreen === 'list'"
        v-model="selectedRoundId"
        v-model:search="search"
        v-model:only-with-participants="onlyWithParticipants"
        :participant-counts="baseParticipantCounts"
        mobile-full-screen
        class="min-h-0 flex-1 md:hidden"
        @select="openRound"
      />

      <div v-if="selectedRound && mobileScreen === 'detail'" class="flex min-h-0 flex-1 flex-col md:hidden">
        <div class="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <AdminBasePaymentVerification
            :round="selectedRound"
            :round-matches="baseStore.roundMatches"
            mobile
          />
        </div>
      </div>

      <div class="hidden min-h-0 flex-1 grid-cols-1 gap-3 md:grid lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <AdminBaseRoundList
          v-model="selectedRoundId"
          v-model:search="search"
          v-model:only-with-participants="onlyWithParticipants"
          :participant-counts="baseParticipantCounts"
          class="min-h-[320px] lg:min-h-0"
        />

        <div v-if="selectedRound" class="flex min-h-0 flex-1 flex-col">
          <div
            class="mb-3 flex shrink-0 flex-wrap items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-mundial-green/15 text-sm font-bold text-mundial-green"
            >
              {{ selectedRound.round_number }}
            </span>
            <span class="text-sm font-semibold text-slate-200">{{ selectedRound.title }}</span>
            <span class="text-xs text-slate-500">
              {{ selectedRound.match_count }} partidos · ${{ BASE_ENTRY_FEE_MXN }} MXN
            </span>
          </div>

          <AdminBasePaymentVerification
            :round="selectedRound"
            :round-matches="baseStore.roundMatches"
            class="min-h-0 flex-1"
          />
        </div>

        <div
          v-else
          class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 p-8"
        >
          <p class="text-slate-500">Selecciona una jornada de la lista</p>
        </div>
      </div>
    </template>
  </div>
</template>
