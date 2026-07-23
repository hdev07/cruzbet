<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { BookOpen, ChevronRight, Medal, Table2, Target } from '@lucide/vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_LOGIC,
} from '@/constants/base-quiniela-rules'
import { QUINIELA_SUMMARY } from '@/constants/nav'
import {
  formatRoundOpensAt,
  resolveNextBaseRound,
} from '@/lib/baseQuinielaRound'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()

const activeRound = computed(() => baseStore.activeRound)
const activeRoundHref = computed(() =>
  activeRound.value ? `/jornadas/${activeRound.value.id}` : null,
)

/** Solo se muestra la siguiente jornada; se abre a mitad de la actual. */
const nextRound = computed(() =>
  resolveNextBaseRound(baseStore.rounds, activeRound.value),
)
const nextRoundFill = computed(() =>
  nextRound.value ? baseStore.roundFillState(nextRound.value.id) : null,
)
const nextRoundOpensLabel = computed(() =>
  nextRoundFill.value?.opensAtMs != null
    ? formatRoundOpensAt(nextRoundFill.value.opensAtMs)
    : null,
)

onMounted(async () => {
  await baseStore.fetchRounds()
  if (auth.user && activeRound.value) {
    await baseStore.fetchMyPredictions(activeRound.value.id, auth.user.id)
  }
})

const progress = computed(() => baseStore.myProgress())
const isSubmitted = computed(() => baseStore.isQuinielaSubmitted())

/** Enlaces secundarios: info y navegación, siempre al final de la vista. */
const secondaryLinks = [
  {
    to: '/reglas',
    icon: BookOpen,
    title: 'Reglas y pagos',
    subtitle: `Cómo funciona · $${BASE_ENTRY_FEE_MXN} MXN por quiniela · cuenta y CLABE`,
  },
  {
    to: '/resultados',
    icon: Medal,
    title: 'Resultados de todos',
    subtitle: 'Tabla comparativa L/E/V por jugador',
  },
  {
    to: '/tablas',
    icon: Table2,
    title: 'Tablas Liga MX',
    subtitle: 'General · Goleo · Menores · Fair Play',
  },
] as const
</script>

<template>
  <div>
    <header class="mb-5">
      <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Liga MX
      </p>
      <h1 class="mt-1 text-2xl font-bold lg:text-3xl">Quiniela L · E · V</h1>
      <p class="mt-1 max-w-lg text-sm text-slate-400">
        {{ QUINIELA_SUMMARY.tagline }}
      </p>
    </header>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-5 rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
    >
      <div class="mb-3 sm:mb-0">
        <p class="text-sm font-medium text-slate-200">Entra para marcar tu quiniela</p>
        <p class="mt-0.5 text-xs text-slate-400">Tus picks se guardan en tu cuenta</p>
      </div>
      <RouterLink
        to="/login"
        class="inline-flex shrink-0 items-center justify-center rounded-lg bg-mundial-green px-4 py-2.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
      >
        Entrar
      </RouterLink>
    </div>

    <div v-if="baseStore.loading && !baseStore.rounds.length" class="mb-6">
      <DataSkeleton variant="rounds" :rows="2" />
    </div>

    <div
      v-else-if="!activeRound"
      class="mb-6 rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      <p class="mb-1 font-semibold text-slate-300">Sin jornadas aún</p>
      <p class="text-sm">{{ BASE_QUINIELA_LOGIC.summary }}</p>
    </div>

    <section v-else-if="activeRoundHref" class="mb-6">
      <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Jornada actual
      </p>
      <RouterLink
        :to="activeRoundHref"
        class="group block overflow-hidden rounded-2xl border border-mundial-green/40 bg-mundial-green/10 transition hover:border-mundial-green/60 hover:bg-mundial-green/15"
      >
        <div class="p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-lg font-bold text-slate-100 group-hover:text-white">
              {{ activeRound.title }}
            </p>
            <p class="mt-1 text-sm text-slate-400">
              {{ activeRound.match_count }} partidos · ${{ BASE_ENTRY_FEE_MXN }} MXN por quiniela
            </p>

            <div
              v-if="auth.isLoggedIn"
              class="mt-3 flex flex-wrap gap-3"
            >
              <span class="rounded-lg border border-mundial-accent/30 bg-mundial-accent/10 px-3 py-1.5 text-xs">
                <span class="text-slate-400">Progreso </span>
                <span class="font-bold text-mundial-accent">{{ progress.filled }}/{{ progress.total }}</span>
              </span>
              <span
                v-if="isSubmitted"
                class="rounded-lg border border-mundial-green/30 bg-mundial-green/10 px-3 py-1.5 text-xs font-semibold text-mundial-green"
              >
                Quiniela guardada
              </span>
            </div>
          </div>

          <span
            class="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-mundial-green px-5 py-3 text-sm font-semibold text-mundial-dark transition group-hover:bg-mundial-green/90 sm:mt-0"
          >
            <Target class="h-4 w-4" />
            {{ auth.isLoggedIn ? (isSubmitted ? 'Ver mi quiniela' : 'Marcar picks') : 'Ver jornada' }}
          </span>
        </div>
      </RouterLink>
    </section>

    <section v-if="nextRound" class="mb-8">
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Siguiente jornada
        </p>
        <RouterLink
          to="/jornadas/todas"
          class="text-xs text-mundial-accent hover:underline"
        >
          Ver todas
        </RouterLink>
      </div>

      <RouterLink
        :to="`/jornadas/${nextRound.id}`"
        class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-mundial-green/30 hover:bg-mundial-green/5"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-slate-300">
          {{ nextRound.round_number }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-slate-200">{{ nextRound.title }}</p>
          <p class="text-xs text-slate-500">{{ nextRound.match_count }} partidos</p>
        </div>
        <span
          v-if="nextRoundFill?.open"
          class="shrink-0 rounded-lg border border-mundial-green/30 bg-mundial-green/10 px-2.5 py-1 text-xs font-semibold text-mundial-green"
        >
          Ya puedes llenarla
        </span>
        <span
          v-else
          class="shrink-0 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-slate-400"
        >
          {{ nextRoundOpensLabel ? `Se abre el ${nextRoundOpensLabel}` : 'Se abre pronto' }}
        </span>
        <ChevronRight class="h-4 w-4 shrink-0 text-slate-500" />
      </RouterLink>
    </section>

    <section aria-label="Más información">
      <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Más información
      </p>
      <div class="space-y-2">
        <RouterLink
          v-for="link in secondaryLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-mundial-accent/30 hover:bg-mundial-accent/5"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300"
          >
            <component :is="link.icon" class="h-4 w-4" :stroke-width="2" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-200">{{ link.title }}</p>
            <p class="truncate text-xs text-slate-500">{{ link.subtitle }}</p>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-slate-500" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
