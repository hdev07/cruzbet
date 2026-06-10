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
  <div>
    <div class="mb-8 text-center lg:mb-10">
      <h1 class="text-2xl font-bold lg:text-4xl">{{ APP_NAME }}</h1>
      <p class="mx-auto mt-2 max-w-md text-sm text-slate-400 lg:text-base">
        {{ APP_TAGLINE }}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Predice, compite en el ranking y gana la bolsa de cada partido o jornada
      </p>
    </div>

    <div
      v-if="!auth.isLoggedIn"
      class="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
    >
      <p class="mb-3 text-sm text-slate-300">Inicia sesión para guardar predicciones y ver tu historial</p>
      <RouterLink
        to="/login"
        class="inline-block rounded-lg bg-mundial-accent px-5 py-2 text-sm font-semibold"
      >
        Entrar con Google
      </RouterLink>
    </div>

    <HomeLandingRules />

    <div class="mb-4 text-center">
      <h2 class="text-lg font-bold text-slate-100 lg:text-xl">Elige tu quiniela</h2>
      <p class="mt-1 text-sm text-slate-500">Cada modalidad tiene su propio ranking, reglas e historial</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <RouterLink
        :to="QUINIELA_MODE_PARTIDO.homePath"
        class="group flex flex-col rounded-2xl border-2 border-mundial-accent/30 bg-gradient-to-br from-mundial-accent/10 to-transparent p-6 transition hover:border-mundial-accent/60 hover:shadow-lg hover:shadow-mundial-accent/10"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-mundial-accent/20">
            <Zap class="h-7 w-7 text-mundial-accent" />
          </span>
          <span class="rounded-full bg-mundial-accent px-3 py-1 text-xs font-bold text-white">
            {{ QUINIELA_MODE_PARTIDO.entryLabel }}
          </span>
        </div>

        <h2 class="text-xl font-bold text-slate-100">{{ QUINIELA_MODE_PARTIDO.title }}</h2>
        <p class="mt-1 text-sm text-slate-400">{{ QUINIELA_MODE_PARTIDO.tagline }}</p>

        <ul class="mt-4 space-y-2 text-sm text-slate-400">
          <li v-for="feature in QUINIELA_MODE_PARTIDO.features" :key="feature" class="flex gap-2">
            <span class="text-mundial-accent">·</span>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <p class="mt-5 flex items-center gap-1 text-sm font-semibold text-mundial-accent group-hover:underline">
          Entrar
          <ChevronRight class="h-4 w-4" />
        </p>
      </RouterLink>

      <RouterLink
        :to="QUINIELA_MODE_BASE.homePath"
        class="group flex flex-col rounded-2xl border-2 border-mundial-green/30 bg-gradient-to-br from-mundial-green/10 to-transparent p-6 transition hover:border-mundial-green/60 hover:shadow-lg hover:shadow-mundial-green/10"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-mundial-green/20">
            <Grid3x3 class="h-7 w-7 text-mundial-green" />
          </span>
          <span class="rounded-full bg-mundial-green px-3 py-1 text-xs font-bold text-mundial-dark">
            {{ QUINIELA_MODE_BASE.entryLabel }}
          </span>
        </div>

        <h2 class="text-xl font-bold text-slate-100">{{ QUINIELA_MODE_BASE.title }}</h2>
        <p class="mt-1 text-sm text-slate-400">{{ QUINIELA_MODE_BASE.tagline }}</p>

        <ul class="mt-4 space-y-2 text-sm text-slate-400">
          <li v-for="feature in QUINIELA_MODE_BASE.features" :key="feature" class="flex gap-2">
            <span class="text-mundial-green">·</span>
            <span>{{ feature }}</span>
          </li>
        </ul>

        <p class="mt-5 flex items-center gap-1 text-sm font-semibold text-mundial-green group-hover:underline">
          Entrar
          <ChevronRight class="h-4 w-4" />
        </p>
      </RouterLink>
    </div>

  </div>
</template>
