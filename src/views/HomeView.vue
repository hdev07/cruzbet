<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChevronRight, Grid3x3, LayoutGrid, Trophy, User } from '@lucide/vue'
import HomeLandingRules from '@/components/home/HomeLandingRules.vue'
import {
  JORNADAS_PATH,
  MUNDIAL_PATH,
  PERFIL_PATH,
  QUINIELA_SUMMARY,
  RANKING_PATH,
} from '@/constants/nav'
import { APP_NAME, APP_TAGLINE } from '@/constants/branding'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()

const sections = [
  {
    to: MUNDIAL_PATH,
    label: 'Mundial',
    description: 'Partidos en vivo, grupos y calendario del torneo',
    icon: LayoutGrid,
    accent: 'mundial-accent',
  },
  {
    to: JORNADAS_PATH,
    label: 'Quiniela',
    description: QUINIELA_SUMMARY.tagline,
    icon: Grid3x3,
    accent: 'mundial-green',
    badge: QUINIELA_SUMMARY.entryLabel,
  },
  {
    to: RANKING_PATH,
    label: 'Ranking',
    description: 'Posiciones y pronósticos por jornada',
    icon: Trophy,
    accent: 'mundial-accent',
  },
  {
    to: auth.isLoggedIn ? PERFIL_PATH : '/login',
    label: auth.isLoggedIn ? 'Mi perfil' : 'Entrar',
    description: auth.isLoggedIn
      ? 'Tu cuenta, historial y configuración'
      : 'Inicia sesión para guardar tus picks',
    icon: User,
    accent: 'slate-300',
  },
] as const
</script>

<template>
  <div class="mx-auto w-full lg:max-w-5xl">
    <div class="mb-8 text-center lg:mb-10">
      <h1 class="text-3xl font-bold tracking-tight text-slate-100 lg:text-4xl">{{ APP_NAME }}</h1>
      <p class="mx-auto mt-3 max-w-md text-base text-slate-300 lg:text-lg">
        {{ APP_TAGLINE }}
      </p>
      <p class="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        Elige una sección para empezar
      </p>
    </div>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">
        Entra con Google para guardar tus picks y ver cómo vas
      </p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-accent px-5 py-2 text-sm font-semibold"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <div class="mb-10 grid gap-3 sm:grid-cols-2">
      <RouterLink
        v-for="section in sections"
        :key="section.to"
        :to="section.to"
        class="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/[0.07] lg:p-6"
        :class="section.label === 'Quiniela' ? 'sm:col-span-2 border-mundial-green/30 bg-mundial-green/5 hover:border-mundial-green/50' : ''"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl"
            :class="
              section.accent === 'mundial-green'
                ? 'bg-mundial-green/20 text-mundial-green'
                : section.accent === 'mundial-accent'
                  ? 'bg-mundial-accent/15 text-mundial-accent'
                  : 'bg-white/10 text-slate-300'
            "
          >
            <component :is="section.icon" class="h-5 w-5" />
          </span>
          <span
            v-if="'badge' in section && section.badge"
            class="rounded-full bg-mundial-green/20 px-2.5 py-0.5 text-xs font-bold text-mundial-green"
          >
            {{ section.badge }}
          </span>
        </div>

        <h2 class="text-lg font-bold text-slate-100">{{ section.label }}</h2>
        <p class="mt-1 flex-1 text-sm text-slate-400">{{ section.description }}</p>

        <p class="mt-4 flex items-center gap-1 text-sm font-semibold text-mundial-accent group-hover:underline">
          Ir
          <ChevronRight class="h-4 w-4" />
        </p>
      </RouterLink>
    </div>

    <HomeLandingRules />
  </div>
</template>
