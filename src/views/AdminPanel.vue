<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import AdminBasePaymentVerification from '@/components/admin/AdminBasePaymentVerification.vue'
import AdminBaseRoundList from '@/components/admin/AdminBaseRoundList.vue'
import { APP_NAME } from '@/constants/branding'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

type MobileScreen = 'list' | 'detail'

const baseStore = useBaseQuinielaStore()

const selectedRoundId = ref('')
const search = ref('')
const onlyWithParticipants = ref(true)
const baseParticipantCounts = ref<Record<string, number>>({})

const mobileScreen = ref<MobileScreen>('list')

const selectedRound = computed(() =>
  baseStore.rounds.find((r) => r.id === selectedRoundId.value),
)

async function loadBaseParticipantCounts() {
  try {
    baseParticipantCounts.value = await baseStore.fetchParticipantCountsByRound()
  } catch {
    baseParticipantCounts.value = {}
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

function openRound(roundId: string) {
  selectedRoundId.value = roundId
  mobileScreen.value = 'detail'
}

function backToList() {
  mobileScreen.value = 'list'
}

onMounted(async () => {
  await Promise.all([baseStore.fetchRounds(), loadBaseParticipantCounts()])
  autoSelectFirstRound()
})

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
    <header v-if="mobileScreen === 'list'" class="shrink-0 border-b border-white/10 px-4 py-3 md:hidden">
      <h1 class="text-lg font-bold text-slate-100">Admin — Jornadas</h1>
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
      <h1 class="text-lg font-bold text-slate-100 lg:text-xl">{{ APP_NAME }} — Admin</h1>
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
  </div>
</template>
