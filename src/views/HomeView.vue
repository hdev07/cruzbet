<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Grid3x3, LayoutGrid, Trophy, User } from '@lucide/vue'
import HomeLandingRules from '@/components/home/HomeLandingRules.vue'
import HomeNextMatchSection from '@/components/home/HomeNextMatchSection.vue'
import {
  JORNADAS_PATH,
  MUNDIAL_PATH,
  PERFIL_PATH,
  QUINIELA_SUMMARY,
  RANKING_PATH,
} from '@/constants/nav'
import { APP_TAGLINE, DEVIFLY_NAME, DEVIFLY_URL } from '@/constants/branding'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()

const greeting = computed(() => {
  if (auth.isLoggedIn && auth.profile?.username) {
    return `Hola, ${auth.profile.username}`
  }
  return '¿Listo para el Mundial?'
})

const subtitle = computed(() => {
  if (auth.isLoggedIn) {
    return 'Aquí tienes lo más importante del torneo y tu quiniela'
  }
  return APP_TAGLINE
})

const quickLinks = [
  { to: MUNDIAL_PATH, label: 'Mundial', icon: LayoutGrid },
  { to: JORNADAS_PATH, label: 'Quiniela', icon: Grid3x3, highlight: true },
  { to: RANKING_PATH, label: 'Ranking', icon: Trophy },
  {
    to: auth.isLoggedIn ? PERFIL_PATH : '/login',
    label: auth.isLoggedIn ? 'Perfil' : 'Entrar',
    icon: User,
  },
] as const
</script>

<template>
  <div class="mx-auto w-full lg:max-w-3xl">
    <header class="mb-6 lg:mb-8">
      <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Inicio
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-100 lg:text-3xl">
        {{ greeting }}
      </h1>
      <p class="mt-2 max-w-md text-sm text-slate-400 lg:text-base">
        {{ subtitle }}
      </p>
    </header>

    <HomeNextMatchSection />

    <div
      v-if="!auth.isLoggedIn"
      class="mt-5 rounded-xl border border-mundial-green/25 bg-mundial-green/5 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
    >
      <div class="mb-3 sm:mb-0">
        <p class="text-sm font-medium text-slate-200">Guarda tus picks y compite</p>
        <p class="mt-0.5 text-xs text-slate-400">
          Entra con Google para participar en la quiniela
        </p>
      </div>
      <RouterLink
        to="/login"
        class="inline-flex shrink-0 items-center justify-center rounded-lg bg-mundial-green px-4 py-2.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-green/90"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <nav class="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <RouterLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
        :class="
          'highlight' in link && link.highlight
            ? 'border-mundial-green/40 bg-mundial-green/10 text-mundial-green hover:bg-mundial-green/15'
            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.07]'
        "
      >
        <component :is="link.icon" class="h-4 w-4" />
        {{ link.label }}
      </RouterLink>
    </nav>

    <p class="mt-3 text-center text-xs text-slate-500">
      {{ QUINIELA_SUMMARY.entryLabel }} · {{ QUINIELA_SUMMARY.tagline }}
    </p>

    <HomeLandingRules />

    <footer class="mt-10 border-t border-white/5 pt-6 pb-2 text-center">
      <p class="text-xs text-slate-500">
        Hecho por
        <a
          :href="DEVIFLY_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="text-slate-400 transition hover:text-slate-300"
        >
          {{ DEVIFLY_NAME }}
        </a>
      </p>
      <nav
        class="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs"
        aria-label="Enlaces legales"
      >
        <RouterLink to="/privacidad" class="text-slate-500 transition hover:text-slate-300">
          Política de privacidad
        </RouterLink>
        <span class="text-slate-700" aria-hidden="true">·</span>
        <RouterLink to="/terminos" class="text-slate-500 transition hover:text-slate-300">
          Términos del servicio
        </RouterLink>
      </nav>
    </footer>
  </div>
</template>
