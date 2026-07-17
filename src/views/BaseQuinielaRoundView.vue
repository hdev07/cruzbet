<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Medal, Wallet } from '@lucide/vue'
import BaseQuinielaEntrySelector from '@/components/predictions/BaseQuinielaEntrySelector.vue'
import BaseQuinielaGrid from '@/components/predictions/BaseQuinielaGrid.vue'
import PaymentInfoCard from '@/components/shared/PaymentInfoCard.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_MATCHES_PER_ROUND,
} from '@/constants/base-quiniela-rules'
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

const progress = computed(() => baseStore.myProgress())

async function loadRound() {
  loadError.value = null
  try {
    await baseStore.fetchRound(roundId.value)
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

    <p v-if="baseStore.loading && !baseStore.currentRound" class="text-slate-400">
      Cargando jornada...
    </p>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <template v-else-if="baseStore.currentRound">
      <div class="mb-6">
        <h1 class="text-2xl font-bold lg:text-3xl">{{ baseStore.currentRound.title }}</h1>
        <p class="mt-1 text-sm text-slate-400">
          ${{ BASE_ENTRY_FEE_MXN }} MXN · {{ matchCount }} partidos · Marca L, E o V antes del kickoff
        </p>
      </div>

      <details class="group mb-6 rounded-xl border border-white/10 bg-white/5 open:pb-0">
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

      <div
        v-if="auth.isLoggedIn"
        class="mb-6 flex flex-wrap gap-3"
      >
        <div class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3">
          <p class="text-xs text-slate-400">Tu progreso</p>
          <p class="text-xl font-bold text-mundial-accent">
            {{ progress.filled }}/{{ progress.total }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="mb-6 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 p-4 text-center"
      >
        <p class="mb-3 text-sm text-slate-300">Inicia sesión para marcar tu quiniela</p>
        <RouterLink
          to="/login"
          class="inline-block rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold text-mundial-dark"
        >
          Entrar
        </RouterLink>
      </div>

      <RouterLink
        to="/resultados"
        class="mb-6 flex items-center gap-3 rounded-xl border border-mundial-green/30 bg-mundial-green/10 px-4 py-3 transition hover:border-mundial-green/50"
      >
        <Medal class="h-5 w-5 shrink-0 text-mundial-green" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-mundial-green">Ver resultados de todos</p>
          <p class="text-xs text-slate-400">Tabla comparativa de picks de la jornada</p>
        </div>
      </RouterLink>

      <BaseQuinielaEntrySelector
        v-if="auth.isLoggedIn"
        v-model:error="entrySelectorError"
        :round-id="roundId"
        :user-id="auth.user?.id"
      />

      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Grilla L · E · V
        </h2>
        <BaseQuinielaGrid
          :round-id="roundId"
          :user-id="auth.user?.id"
          :can-predict="auth.isLoggedIn"
          :round-matches="baseStore.roundMatches"
          :match-count="matchCount"
        />
      </section>
    </template>
  </div>
</template>
