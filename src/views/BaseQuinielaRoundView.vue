<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Lock, Medal, Wallet } from '@lucide/vue'
import BaseQuinielaEntrySelector from '@/components/predictions/BaseQuinielaEntrySelector.vue'
import BaseQuinielaGrid from '@/components/predictions/BaseQuinielaGrid.vue'
import PaymentReceiptUpload from '@/components/predictions/PaymentReceiptUpload.vue'
import PaymentInfoCard from '@/components/shared/PaymentInfoCard.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import SkeletonBone from '@/components/shared/SkeletonBone.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_MATCHES_PER_ROUND,
} from '@/constants/base-quiniela-rules'
import { formatRoundOpensAt } from '@/lib/baseQuinielaRound'
import { friendlyLoadError } from '@/lib/offlineCache'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const route = useRoute()
const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loadError = ref<string | null>(null)

const roundId = computed(() => route.params.id as string)
const entrySelectorError = ref<string | null>(null)

const matchCount = computed(
  () => baseStore.currentRound?.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND,
)

/** Comprobante: solo cuando la quiniela actual ya se guardó. */
const showReceiptCard = computed(
  () => auth.isLoggedIn && !!auth.user && baseStore.isQuinielaSubmitted(),
)

/** Regla: solo la jornada activa y la siguiente (a mitad de la activa) se llenan. */
const fillState = computed(() => baseStore.roundFillState(roundId.value))
const fillOpensAtLabel = computed(() =>
  fillState.value.opensAtMs != null ? formatRoundOpensAt(fillState.value.opensAtMs) : null,
)

async function loadRound() {
  loadError.value = null
  try {
    await Promise.all([
      baseStore.fetchRound(roundId.value),
      // Datos de todas las jornadas: necesarios para la regla de llenado.
      // Si falla, la regla no bloquea (los candados por partido siguen).
      baseStore.fetchRounds().catch(() => {}),
    ])
    if (auth.user) {
      await baseStore.fetchMyPredictions(roundId.value, auth.user.id)
    }
  } catch (err) {
    loadError.value = friendlyLoadError(err, 'No se pudo cargar la jornada')
  }
}

onMounted(loadRound)
watch(roundId, loadRound)
</script>

<template>
  <div>
    <RouterLink
      to="/jornadas"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-mundial-green"
    >
      <ArrowLeft class="h-4 w-4" />
      Quiniela
    </RouterLink>

    <div v-if="baseStore.loading && !baseStore.currentRound" class="space-y-4">
      <div class="space-y-2">
        <SkeletonBone class="h-8 w-48" />
        <SkeletonBone class="h-4 w-64 bg-white/5" />
      </div>
      <DataSkeleton variant="match-grid" :rows="5" />
    </div>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <template v-else-if="baseStore.currentRound">
      <div class="mb-4">
        <h1 class="text-2xl font-bold lg:text-3xl">{{ baseStore.currentRound.title }}</h1>
        <p class="mt-1 text-sm text-slate-400">
          ${{ BASE_ENTRY_FEE_MXN }} MXN · {{ matchCount }} partidos · Marca L, E o V antes del kickoff
        </p>
      </div>

      <div
        v-if="!fillState.open"
        class="mb-5 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"
      >
        <Lock class="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div>
          <p class="text-sm font-semibold text-amber-200">
            Esta jornada aún no se abre
          </p>
          <p class="mt-0.5 text-xs text-amber-200/80">
            <template v-if="fillOpensAtLabel">
              Podrás marcar tus picks a partir del {{ fillOpensAtLabel }}.
            </template>
            <template v-else>
              Se abrirá a mitad de la jornada actual.
            </template>
            Mientras tanto puedes ver los partidos programados.
          </p>
        </div>
      </div>

      <div
        v-if="!auth.isLoggedIn"
        class="mb-5 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 text-center"
      >
        <p class="mb-3 text-sm text-slate-300">Inicia sesión para marcar tu quiniela</p>
        <RouterLink
          to="/login"
          class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold text-mundial-dark"
        >
          Entrar
        </RouterLink>
      </div>

      <BaseQuinielaEntrySelector
        v-if="auth.isLoggedIn && fillState.open"
        v-model:error="entrySelectorError"
        :round-id="roundId"
        :user-id="auth.user?.id"
      />

      <PaymentReceiptUpload
        v-if="showReceiptCard && auth.user"
        class="mb-5"
        :round-id="roundId"
        :user-id="auth.user.id"
      />

      <section class="mb-6">
        <BaseQuinielaGrid
          :round-id="roundId"
          :user-id="auth.user?.id"
          :can-predict="auth.isLoggedIn && fillState.open"
          :round-matches="baseStore.roundMatches"
          :match-count="matchCount"
        />
      </section>

      <!-- Info secundaria: después de la grilla para no estorbar el llenado.
           pb extra en móvil por el botón fijo de "Guardar quiniela". -->
      <div class="space-y-4 pb-24 md:pb-0">
        <details class="group rounded-xl border border-white/10 bg-white/5 open:pb-0">
          <summary
            class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-mundial-green marker:content-none [&::-webkit-details-marker]:hidden"
          >
            <Wallet class="h-4 w-4 shrink-0" />
            Datos de pago — ${{ BASE_ENTRY_FEE_MXN }} MXN
            <span class="ml-auto text-xs font-normal text-slate-500 group-open:hidden">
              Ver cuenta / CLABE
            </span>
            <span class="ml-auto hidden text-xs font-normal text-slate-500 group-open:inline">
              Ocultar
            </span>
          </summary>
          <div class="border-t border-white/10 px-4 pb-4 pt-3">
            <PaymentInfoCard :framed="false" :show-notes="true" title="" />
          </div>
        </details>

        <RouterLink
          to="/resultados"
          class="flex items-center gap-3 rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-4 py-3 transition hover:border-mundial-green/50"
        >
          <Medal class="h-5 w-5 shrink-0 text-mundial-green" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-mundial-green">Ver resultados de todos</p>
            <p class="text-xs text-slate-400">Tabla comparativa de picks de la jornada</p>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>
