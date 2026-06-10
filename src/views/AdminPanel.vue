<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminMatchList from '@/components/admin/AdminMatchList.vue'
import AdminPaymentVerification from '@/components/admin/AdminPaymentVerification.vue'
import QuinielaControl from '@/components/admin/QuinielaControl.vue'
import { APP_NAME } from '@/constants/branding'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import { useMatchStore } from '@/stores/matchStore'
import { usePredictionStore } from '@/stores/predictionStore'

const matchStore = useMatchStore()
const predictionStore = usePredictionStore()

const selectedMatchId = ref('')
const search = ref('')
const statusFilter = ref<'all' | 'scheduled' | 'live' | 'finished'>('all')
const onlyWithParticipants = ref(true)
const participantCounts = ref<Record<string, number>>({})

const selectedMatch = computed(() =>
  matchStore.matches.find((m) => m.id === selectedMatchId.value),
)

async function loadParticipantCounts() {
  try {
    participantCounts.value = await predictionStore.fetchParticipantCountsByMatch()
  } catch {
    participantCounts.value = {}
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

onMounted(async () => {
  await matchStore.fetchMatches()
  await loadParticipantCounts()
  autoSelectFirstMatch()
})

watch(
  () => matchStore.matches.length,
  () => autoSelectFirstMatch(),
)
</script>

<template>
  <div class="-my-2 flex min-h-[calc(100dvh-5.5rem)] flex-col lg:-my-4">
    <header class="mb-3 shrink-0">
      <h1 class="text-lg font-bold text-slate-100 lg:text-xl">{{ APP_NAME }} — Admin</h1>
      <p class="text-xs text-slate-500">
        Partido a la izquierda · depósitos de ${{ ENTRY_FEE_MXN }} MXN a la derecha
      </p>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
      <AdminMatchList
        v-model="selectedMatchId"
        v-model:search="search"
        v-model:status-filter="statusFilter"
        v-model:only-with-participants="onlyWithParticipants"
        :participant-counts="participantCounts"
        class="min-h-[280px] xl:max-h-none xl:min-h-0"
      />

      <div v-if="selectedMatch" class="flex min-h-0 flex-1 flex-col gap-2">
        <div class="flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <img
            v-if="selectedMatch.home_team?.flag_url"
            :src="selectedMatch.home_team.flag_url"
            :alt="selectedMatch.home_team?.name"
            class="h-6 w-8 rounded-sm object-cover"
          />
          <span class="text-sm font-semibold text-slate-200">
            {{ selectedMatch.home_team?.name }}
          </span>
          <span class="text-base font-bold tabular-nums text-mundial-accent">
            <template v-if="selectedMatch.status !== 'scheduled'">
              {{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}
            </template>
            <template v-else>vs</template>
          </span>
          <span class="text-sm font-semibold text-slate-200">
            {{ selectedMatch.away_team?.name }}
          </span>
          <img
            v-if="selectedMatch.away_team?.flag_url"
            :src="selectedMatch.away_team.flag_url"
            :alt="selectedMatch.away_team?.name"
            class="h-6 w-8 rounded-sm object-cover"
          />
          <span
            v-if="selectedMatch.status === 'live'"
            class="rounded-full bg-mundial-green px-2 py-0.5 text-[11px] font-semibold"
          >
            EN VIVO {{ selectedMatch.current_minute ?? 0 }}'
          </span>
        </div>

        <details class="shrink-0 rounded-lg border border-white/10 bg-white/5">
          <summary class="cursor-pointer px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200">
            Control del partido (marcador y goles)
          </summary>
          <div class="border-t border-white/10 p-3">
            <QuinielaControl :match="selectedMatch" />
          </div>
        </details>

        <AdminPaymentVerification :match="selectedMatch" />
      </div>

      <div
        v-else
        class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 p-8"
      >
        <p class="text-slate-500">Selecciona un partido de la lista</p>
      </div>
    </div>
  </div>
</template>
