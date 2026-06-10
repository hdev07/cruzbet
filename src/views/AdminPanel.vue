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
  <div class="mx-auto flex h-[calc(100vh-5rem)] w-full max-w-[1800px] flex-col">
    <header class="mb-4 shrink-0">
      <h1 class="text-xl font-bold text-slate-100 lg:text-2xl">{{ APP_NAME }} — Admin</h1>
      <p class="mt-1 text-sm text-slate-400">
        Elige un partido a la izquierda y verifica depósitos de ${{ ENTRY_FEE_MXN }} MXN a la derecha.
      </p>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <AdminMatchList
        v-model="selectedMatchId"
        v-model:search="search"
        v-model:status-filter="statusFilter"
        v-model:only-with-participants="onlyWithParticipants"
        :participant-counts="participantCounts"
        class="min-h-[420px] xl:min-h-0"
      />

      <div v-if="selectedMatch" class="flex min-h-0 flex-col gap-4">
        <div class="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <img
              v-if="selectedMatch.home_team?.flag_url"
              :src="selectedMatch.home_team.flag_url"
              :alt="selectedMatch.home_team.name"
              class="h-10 w-14 rounded object-cover"
            />
            <div class="min-w-0 flex-1 text-center">
              <p class="truncate text-sm font-bold text-slate-100">
                {{ selectedMatch.home_team?.name }}
              </p>
              <p class="mt-1 text-2xl font-bold tabular-nums text-mundial-accent">
                <template v-if="selectedMatch.status !== 'scheduled'">
                  {{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}
                </template>
                <template v-else>vs</template>
              </p>
              <p class="truncate text-sm font-bold text-slate-100">
                {{ selectedMatch.away_team?.name }}
              </p>
            </div>
            <img
              v-if="selectedMatch.away_team?.flag_url"
              :src="selectedMatch.away_team.flag_url"
              :alt="selectedMatch.away_team.name"
              class="h-10 w-14 rounded object-cover"
            />
          </div>

          <QuinielaControl :match="selectedMatch" />
        </div>

        <AdminPaymentVerification :match="selectedMatch" class="min-h-0 flex-1" />
      </div>

      <div
        v-else
        class="flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8"
      >
        <p class="text-center text-slate-500">Selecciona un partido de la lista</p>
      </div>
    </div>
  </div>
</template>
