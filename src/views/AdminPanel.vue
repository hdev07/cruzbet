<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Grid3x3, List, Radio, Wallet } from '@lucide/vue'
import AdminBasePaymentVerification from '@/components/admin/AdminBasePaymentVerification.vue'
import AdminBaseRoundList from '@/components/admin/AdminBaseRoundList.vue'
import AdminMatchList from '@/components/admin/AdminMatchList.vue'
import AdminPaymentVerification from '@/components/admin/AdminPaymentVerification.vue'
import QuinielaControl from '@/components/admin/QuinielaControl.vue'
import { APP_NAME } from '@/constants/branding'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useMatchStore } from '@/stores/matchStore'
import { usePredictionStore } from '@/stores/predictionStore'

type AdminMode = 'partido' | 'base'
type MobileScreen = 'list' | 'detail'
type DetailTab = 'match' | 'payments'

const matchStore = useMatchStore()
const predictionStore = usePredictionStore()
const baseStore = useBaseQuinielaStore()

const adminMode = ref<AdminMode>('partido')
const selectedMatchId = ref('')
const selectedRoundId = ref('')
const search = ref('')
const statusFilter = ref<'all' | 'scheduled' | 'live' | 'finished'>('all')
const onlyWithParticipants = ref(true)
const participantCounts = ref<Record<string, number>>({})
const baseParticipantCounts = ref<Record<string, number>>({})

const mobileScreen = ref<MobileScreen>('list')
const detailTab = ref<DetailTab>('match')

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
  if (selectedMatchId.value) return

  const withParticipants = matchStore.matches.filter((m) => (participantCounts.value[m.id] ?? 0) > 0)
  if (withParticipants.length) {
    selectedMatchId.value = withParticipants[0]!.id
    return
  }

  if (matchStore.matches.length) {
    selectedMatchId.value = matchStore.matches[0]!.id
  }
}

function autoSelectFirstRound() {
  if (selectedRoundId.value) return

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
    /* detalle mostrará error en hijo si aplica */
  }
}

function openMatch(matchId: string) {
  selectedMatchId.value = matchId
  mobileScreen.value = 'detail'
  detailTab.value = 'match'
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
}

onMounted(async () => {
  await Promise.all([
    matchStore.fetchMatches(),
    baseStore.fetchRounds(),
    loadParticipantCounts(),
    loadBaseParticipantCounts(),
  ])
  autoSelectFirstMatch()
  autoSelectFirstRound()
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
    <!-- Selector de modo -->
    <div class="shrink-0 border-b border-white/10 px-4 py-2 md:px-0">
      <div class="flex gap-1 rounded-xl bg-white/5 p-1 md:inline-flex">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition md:flex-none md:px-5"
          :class="
            adminMode === 'partido'
              ? 'bg-mundial-accent text-white'
              : 'text-slate-400 hover:text-slate-200'
          "
          @click="switchMode('partido')"
        >
          <Radio class="h-4 w-4" />
          Quiniela partido
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition md:flex-none md:px-5"
          :class="
            adminMode === 'base'
              ? 'bg-mundial-accent text-white'
              : 'text-slate-400 hover:text-slate-200'
          "
          @click="switchMode('base')"
        >
          <Grid3x3 class="h-4 w-4" />
          Quiniela base
        </button>
      </div>
    </div>

    <!-- ═══ MODO PARTIDO ═══ -->
    <template v-if="adminMode === 'partido'">
      <header v-if="mobileScreen === 'list'" class="shrink-0 border-b border-white/10 px-4 py-3 md:hidden">
        <h1 class="text-lg font-bold text-slate-100">Admin — Partido</h1>
        <p class="text-xs text-slate-500">Elige un partido para marcar goles y verificar pagos</p>
      </header>

      <header
        v-else-if="selectedMatch"
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

        <div class="px-4 pb-3">
          <div class="flex items-center justify-center gap-2">
            <img
              v-if="selectedMatch.home_team?.flag_url"
              :src="selectedMatch.home_team.flag_url"
              :alt="teamDisplayName(selectedMatch.home_team, 'Local')"
              class="h-7 w-9 shrink-0 rounded-sm object-cover"
            />
            <span class="min-w-0 flex-1 truncate text-right text-sm font-semibold">
              {{ teamDisplayName(selectedMatch.home_team, 'Local') }}
            </span>
            <span class="shrink-0 px-1 text-xl font-bold tabular-nums text-mundial-accent">
              <template v-if="selectedMatch.status !== 'scheduled'">
                {{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}
              </template>
              <template v-else>vs</template>
            </span>
            <span class="min-w-0 flex-1 truncate text-sm font-semibold">
              {{ teamDisplayName(selectedMatch.away_team, 'Visitante') }}
            </span>
            <img
              v-if="selectedMatch.away_team?.flag_url"
              :src="selectedMatch.away_team.flag_url"
              :alt="teamDisplayName(selectedMatch.away_team, 'Visitante')"
              class="h-7 w-9 shrink-0 rounded-sm object-cover"
            />
          </div>

          <p class="mt-1.5 text-center text-xs text-slate-500">
            <span
              v-if="selectedMatch.status === 'live'"
              class="inline-flex items-center gap-1 font-semibold text-mundial-green"
            >
              <Radio class="h-3 w-3" />
              EN VIVO · {{ selectedMatch.current_minute ?? 0 }}'
            </span>
            <span v-else-if="selectedMatch.status === 'finished'">Finalizado</span>
            <span v-else>Programado</span>
            <span v-if="participantCounts[selectedMatch.id]">
              · {{ participantCounts[selectedMatch.id] }} en quiniela
            </span>
          </p>
        </div>

        <div class="flex border-t border-white/10">
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition"
            :class="
              detailTab === 'match'
                ? 'border-b-2 border-mundial-accent text-mundial-accent'
                : 'text-slate-400'
            "
            @click="detailTab = 'match'"
          >
            <List class="h-4 w-4" />
            Marcador
          </button>
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition"
            :class="
              detailTab === 'payments'
                ? 'border-b-2 border-mundial-accent text-mundial-accent'
                : 'text-slate-400'
            "
            @click="detailTab = 'payments'"
          >
            <Wallet class="h-4 w-4" />
            Pagos
          </button>
        </div>
      </header>

      <header class="mb-3 hidden shrink-0 md:block">
        <h1 class="text-lg font-bold text-slate-100 lg:text-xl">{{ APP_NAME }} — Admin partido</h1>
        <p class="text-xs text-slate-500">
          Marcador y goles · depósitos de ${{ ENTRY_FEE_MXN }} MXN por partido
        </p>
      </header>

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
        <div class="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <QuinielaControl v-show="detailTab === 'match'" :match="selectedMatch" mobile />
          <AdminPaymentVerification
            v-show="detailTab === 'payments'"
            :match="selectedMatch"
            mobile
          />
        </div>
      </div>

      <div class="hidden min-h-0 flex-1 grid-cols-1 gap-3 md:grid lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <AdminMatchList
          v-model="selectedMatchId"
          v-model:search="search"
          v-model:status-filter="statusFilter"
          v-model:only-with-participants="onlyWithParticipants"
          :participant-counts="participantCounts"
          class="min-h-[320px] lg:min-h-0"
        />

        <div v-if="selectedMatch" class="flex min-h-[420px] flex-col gap-3 lg:min-h-0">
          <div
            class="flex shrink-0 flex-wrap items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <img
              v-if="selectedMatch.home_team?.flag_url"
              :src="selectedMatch.home_team.flag_url"
              :alt="teamDisplayName(selectedMatch.home_team, 'Local')"
              class="h-6 w-8 rounded-sm object-cover"
            />
            <span class="text-sm font-semibold text-slate-200">{{ teamDisplayName(selectedMatch.home_team, 'Local') }}</span>
            <span class="text-base font-bold tabular-nums text-mundial-accent">
              <template v-if="selectedMatch.status !== 'scheduled'">
                {{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}
              </template>
              <template v-else>vs</template>
            </span>
            <span class="text-sm font-semibold text-slate-200">{{ teamDisplayName(selectedMatch.away_team, 'Visitante') }}</span>
            <img
              v-if="selectedMatch.away_team?.flag_url"
              :src="selectedMatch.away_team.flag_url"
              :alt="teamDisplayName(selectedMatch.away_team, 'Visitante')"
              class="h-6 w-8 rounded-sm object-cover"
            />
            <span
              v-if="selectedMatch.status === 'live'"
              class="rounded-full bg-mundial-green px-2 py-0.5 text-[11px] font-semibold"
            >
              EN VIVO {{ selectedMatch.current_minute ?? 0 }}'
            </span>
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-2">
            <div class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <div class="shrink-0 border-b border-white/10 px-4 py-2.5">
                <h2 class="text-sm font-semibold text-slate-200">Marcador y goles</h2>
              </div>
              <div class="app-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
                <QuinielaControl :match="selectedMatch" />
              </div>
            </div>

            <AdminPaymentVerification :match="selectedMatch" class="min-h-[280px]" />
          </div>
        </div>

        <div
          v-else
          class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 p-8"
        >
          <p class="text-slate-500">Selecciona un partido de la lista</p>
        </div>
      </div>
    </template>

    <!-- ═══ MODO BASE ═══ -->
    <template v-else>
      <header v-if="mobileScreen === 'list'" class="shrink-0 border-b border-white/10 px-4 py-3 md:hidden">
        <h1 class="text-lg font-bold text-slate-100">Admin — Quiniela base</h1>
        <p class="text-xs text-slate-500">Verifica depósitos y revisa las quinielas de cada jornada</p>
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
            <span v-if="baseParticipantCounts[selectedRound.id]">
              · {{ baseParticipantCounts[selectedRound.id] }} participantes
            </span>
          </p>
        </div>
      </header>

      <header class="mb-3 hidden shrink-0 md:block">
        <h1 class="text-lg font-bold text-slate-100 lg:text-xl">{{ APP_NAME }} — Admin quiniela base</h1>
        <p class="text-xs text-slate-500">
          Depósitos de ${{ BASE_ENTRY_FEE_MXN }} MXN por jornada · ver quinielas de todos los usuarios
        </p>
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
