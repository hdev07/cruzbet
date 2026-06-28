<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ChevronRight,
  ClipboardList,
  History,
  Medal,
  Target,
  Trophy,
} from '@lucide/vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_LOGIC,
} from '@/constants/base-quiniela-rules'
import { QUINIELA_SUMMARY } from '@/constants/nav'
import { resolveUpcomingBaseRounds } from '@/lib/baseQuinielaRound'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()

const quickStartSteps = [
  'Marca L, E o V en cada partido antes de que empiece.',
  'Completa todos los partidos de la jornada y guarda tu quiniela.',
  'Gana quien más acierte en la jornada.',
] as const

const secondaryLinks = computed(() => {
  const links = [
    { to: '/reglas', label: 'Reglas y pago', icon: ClipboardList, desc: `$${BASE_ENTRY_FEE_MXN} MXN por jornada` },
    { to: '/resultados', label: 'Resultados', icon: Medal, desc: 'Ganadores por jornada' },
    { to: '/ranking', label: 'Ranking', icon: Trophy, desc: 'Posiciones en vivo' },
  ]
  if (auth.isLoggedIn) {
    links.push({ to: '/historial', label: 'Mi historial', icon: History, desc: 'Tus picks anteriores' })
  }
  return links
})

const activeRound = computed(() => baseStore.activeRound)
const activeRoundHref = computed(() =>
  activeRound.value ? `/jornadas/${activeRound.value.id}` : null,
)

const upcomingRounds = computed(() =>
  resolveUpcomingBaseRounds(baseStore.rounds, activeRound.value),
)

onMounted(async () => {
  await baseStore.fetchRounds()
  if (auth.user && activeRound.value) {
    await baseStore.fetchMyPredictions(activeRound.value.id, auth.user.id)
  }
})

const progress = computed(() => baseStore.myProgress())
const isSubmitted = computed(() => baseStore.isQuinielaSubmitted())
</script>

<template>
  <div>
    <header class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Quiniela
      </p>
      <h1 class="mt-1 text-2xl font-bold lg:text-3xl">Jugar la jornada</h1>
      <p class="mt-2 max-w-lg text-sm text-slate-400 lg:text-base">
        {{ QUINIELA_SUMMARY.tagline }}. Cada jornada tiene su propio premio.
      </p>
    </header>

    <section
      class="mb-6 rounded-xl border border-white/10 bg-white/5 p-4"
      aria-label="Cómo funciona"
    >
      <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-mundial-green">
        ¿Primera vez? Así funciona
      </p>
      <ol class="space-y-2">
        <li
          v-for="(step, index) in quickStartSteps"
          :key="index"
          class="flex gap-3 text-sm text-slate-300"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mundial-green/15 text-xs font-bold text-mundial-green"
          >
            {{ index + 1 }}
          </span>
          {{ step }}
        </li>
      </ol>
      <RouterLink
        to="/reglas"
        class="mt-3 inline-flex items-center gap-1 text-xs text-mundial-green hover:underline"
      >
        Ver reglas completas y datos de pago
        <ChevronRight class="h-3.5 w-3.5" />
      </RouterLink>
    </section>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-6 rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
    >
      <div class="mb-3 sm:mb-0">
        <p class="text-sm font-medium text-slate-200">Entra para marcar tu quiniela</p>
        <p class="mt-0.5 text-xs text-slate-400">Tus picks se guardan y compites en el ranking</p>
      </div>
      <RouterLink
        to="/login"
        class="inline-flex shrink-0 items-center justify-center rounded-lg bg-mundial-green px-4 py-2.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <p v-if="baseStore.loading && !baseStore.rounds.length" class="text-slate-400">
      Cargando jornadas...
    </p>

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
              {{ activeRound.match_count }} partidos · ${{ BASE_ENTRY_FEE_MXN }} MXN
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

    <nav
      class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label="Accesos rápidos"
    >
      <RouterLink
        v-for="link in secondaryLinks"
        :key="link.to"
        :to="link.to"
        class="flex flex-col rounded-xl border border-white/10 bg-white/5 px-3 py-3 transition hover:border-white/20 hover:bg-white/[0.07]"
      >
        <component :is="link.icon" class="mb-2 h-4 w-4 text-mundial-accent" />
        <span class="text-sm font-medium text-slate-200">{{ link.label }}</span>
        <span class="mt-0.5 text-[0.65rem] text-slate-500">{{ link.desc }}</span>
      </RouterLink>
    </nav>

    <section v-if="upcomingRounds.length">
      <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Jornadas siguientes
      </p>

      <div class="space-y-2">
        <RouterLink
          v-for="round in upcomingRounds"
          :key="round.id"
          :to="`/jornadas/${round.id}`"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-mundial-green/30 hover:bg-mundial-green/5"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-slate-300">
            {{ round.round_number }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-200">{{ round.title }}</p>
            <p class="text-xs text-slate-500">{{ round.match_count }} partidos</p>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-slate-500" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
