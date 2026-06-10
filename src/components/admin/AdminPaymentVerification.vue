<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle2, CircleDashed, Loader2 } from '@lucide/vue'
import { predictionSummary } from '@/lib/predictionDisplay'
import { usePredictionStore } from '@/stores/predictionStore'
import type { Match, MatchParticipant } from '@/types'

const props = defineProps<{
  match: Match
}>()

const predictionStore = usePredictionStore()
const participants = ref<MatchParticipant[]>([])
const loading = ref(false)
const togglingUserId = ref<string | null>(null)
const error = ref('')

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

const verifiedCount = () => participants.value.filter((p) => p.verified).length
</script>

<template>
  <section class="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
    <div>
      <h3 class="font-semibold">Predicciones y depósitos</h3>
      <p class="mt-1 text-xs text-slate-400">
        Verifica si el depósito de $10 MXN llegó a tu cuenta. Solo los participantes verificados
        compiten por la bolsa del partido.
      </p>
      <p v-if="participants.length" class="mt-2 text-xs text-slate-500">
        {{ verifiedCount() }} de {{ participants.length }} con depósito verificado
      </p>
    </div>

    <p v-if="loading" class="flex items-center gap-2 text-sm text-slate-400">
      <Loader2 class="h-4 w-4 animate-spin" />
      Cargando predicciones...
    </p>

    <p v-else-if="!participants.length" class="text-sm text-slate-500">
      Nadie ha registrado predicciones para este partido.
    </p>

    <ul v-else class="space-y-3">
      <li
        v-for="participant in participants"
        :key="participant.user_id"
        class="rounded-lg border border-white/10 bg-black/20 p-3"
        :class="participant.verified ? 'border-mundial-green/30' : 'border-amber-500/20'"
      >
        <div class="flex items-start gap-3">
          <button
            type="button"
            class="mt-0.5 shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10 disabled:opacity-50"
            :disabled="togglingUserId === participant.user_id"
            :title="participant.verified ? 'Marcar como no verificado' : 'Marcar depósito verificado'"
            @click="toggleVerified(participant)"
          >
            <Loader2
              v-if="togglingUserId === participant.user_id"
              class="h-5 w-5 animate-spin text-slate-400"
            />
            <CheckCircle2
              v-else-if="participant.verified"
              class="h-5 w-5 text-mundial-green"
            />
            <CircleDashed v-else class="h-5 w-5 text-amber-400" />
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-medium text-slate-200">
                {{ participant.profiles?.username ?? 'Usuario' }}
              </p>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="
                  participant.verified
                    ? 'bg-mundial-green/20 text-mundial-green'
                    : 'bg-amber-500/20 text-amber-300'
                "
              >
                {{ participant.verified ? 'Depósito verificado' : 'Sin verificar' }}
              </span>
              <span
                v-if="match.status === 'finished'"
                class="text-xs font-bold tabular-nums text-mundial-accent"
              >
                {{ participant.total_points }} pts
              </span>
            </div>

            <ul class="mt-2 space-y-1">
              <li
                v-for="pred in participant.predictions"
                :key="pred.id"
                class="text-xs text-slate-400"
              >
                {{ predictionSummary(pred, match) }}
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ul>

    <p
      v-if="match.status === 'finished' && participants.length && verifiedCount() === 0"
      class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
    >
      Sin depósitos verificados: no hay ganador para este partido.
    </p>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
  </section>
</template>
