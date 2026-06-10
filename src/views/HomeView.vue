<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChevronRight, Grid3x3, Zap } from '@lucide/vue'
import HomeLandingRules from '@/components/home/HomeLandingRules.vue'
import { QUINIELA_MODE_BASE, QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'
import { APP_NAME, APP_TAGLINE } from '@/constants/branding'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
</script>

<template>
  <div class="mx-auto w-full lg:max-w-4xl">
    <div class="mb-8 text-center lg:mb-10">
      <h1 class="text-2xl font-bold lg:text-4xl">{{ APP_NAME }}</h1>
      <p class="mx-auto mt-2 max-w-md text-sm text-slate-300 lg:text-base">
        {{ APP_TAGLINE }}
      </p>
      <p class="mt-2 text-sm text-slate-500">
        Adivina quién gana. La quiniela base es la principal; la de por partido es extra.
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

    <!-- Quiniela base — principal -->
    <RouterLink
      :to="QUINIELA_MODE_BASE.homePath"
      class="group mb-4 flex flex-col rounded-2xl border-2 border-mundial-green/50 bg-gradient-to-br from-mundial-green/15 to-transparent p-6 transition hover:border-mundial-green hover:shadow-lg hover:shadow-mundial-green/10 lg:p-8"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-mundial-green/25">
          <Grid3x3 class="h-7 w-7 text-mundial-green" />
        </span>
        <span class="rounded-full bg-mundial-green px-3 py-1 text-xs font-bold text-mundial-dark">
          La principal
        </span>
      </div>

      <h2 class="text-xl font-bold text-slate-100 lg:text-2xl">{{ QUINIELA_MODE_BASE.title }}</h2>
      <p class="mt-2 text-sm text-slate-300 lg:text-base">{{ QUINIELA_MODE_BASE.tagline }}</p>

      <ul class="mt-4 space-y-2 text-sm text-slate-400">
        <li v-for="feature in QUINIELA_MODE_BASE.features" :key="feature" class="flex gap-2">
          <span class="text-mundial-green">✓</span>
          <span>{{ feature }}</span>
        </li>
      </ul>

      <p
        class="mt-6 flex items-center gap-1 text-sm font-semibold text-mundial-green group-hover:underline lg:text-base"
      >
        Ir a la quiniela base
        <ChevronRight class="h-4 w-4" />
      </p>
    </RouterLink>

    <!-- Quiniela por partido — secundaria -->
    <div class="mb-8">
      <p class="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
        También puedes jugar
      </p>

      <RouterLink
        :to="QUINIELA_MODE_PARTIDO.homePath"
        class="group flex flex-col rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-mundial-accent/40 hover:bg-white/[0.07]"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-mundial-accent/15">
            <Zap class="h-5 w-5 text-mundial-accent" />
          </span>
          <span class="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
            Extra · {{ QUINIELA_MODE_PARTIDO.entryLabel }}
          </span>
        </div>

        <h2 class="text-lg font-bold text-slate-200">{{ QUINIELA_MODE_PARTIDO.title }}</h2>
        <p class="mt-1 text-sm text-slate-400">{{ QUINIELA_MODE_PARTIDO.tagline }}</p>

        <ul class="mt-3 space-y-1.5 text-sm text-slate-500">
          <li v-for="feature in QUINIELA_MODE_PARTIDO.features" :key="feature" class="flex gap-2">
            <span class="text-mundial-accent/70">·</span>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <p class="mt-4 flex items-center gap-1 text-sm font-medium text-mundial-accent group-hover:underline">
          Ver partidos
          <ChevronRight class="h-4 w-4" />
        </p>
      </RouterLink>
    </div>

    <HomeLandingRules />
  </div>
</template>
