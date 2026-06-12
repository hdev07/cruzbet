<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
</script>

<template>
  <section class="mb-10 border-t border-white/10 pt-10">
    <header class="mb-8 text-center">
      <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Reglas rápidas
      </p>
      <h2 class="text-2xl font-bold text-slate-100 lg:text-3xl">¿Cómo funciona?</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm text-slate-400">En palabras simples</p>
    </header>

    <article class="mx-auto max-w-xl rounded-2xl border border-mundial-green/30 bg-mundial-green/5 p-6">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-mundial-green">
            Quiniela
          </p>
          <h3 class="text-xl font-bold text-slate-100">Jornadas</h3>
        </div>
        <span
          class="rounded-full bg-mundial-green/20 px-3 py-1 text-sm font-bold text-mundial-green"
        >
          ${{ BASE_ENTRY_FEE_MXN }} / jornada
        </span>
      </div>

      <ol class="space-y-4 text-sm leading-relaxed text-slate-300">
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-green/25 text-xs font-bold text-mundial-green"
          >
            1
          </span>
          <span>
            Pagas <strong class="text-slate-100">${{ BASE_ENTRY_FEE_MXN }} pesos</strong> por cada
            jornada en la que quieras jugar.
          </span>
        </li>
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-green/25 text-xs font-bold text-mundial-green"
          >
            2
          </span>
          <span>
            Hay <strong class="text-slate-100">{{ BASE_QUINIELA_MATCHES_PER_ROUND }} partidos</strong>.
            Antes de que empiece cada uno marcas quién crees que gane:
            <strong class="text-slate-100">L</strong> (local),
            <strong class="text-slate-100">E</strong> (empate) o
            <strong class="text-slate-100">V</strong> (visitante).
          </span>
        </li>
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-green/25 text-xs font-bold text-mundial-green"
          >
            3
          </span>
          <span>
            Cada pick que aciertas suma
            <strong class="text-slate-100">{{ BASE_QUINIELA_POINTS_PER_HIT }} puntos</strong>. Si te
            equivocas, vale 0 (no te quitan puntos).
          </span>
        </li>
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-green/25 text-xs font-bold text-mundial-green"
          >
            4
          </span>
          <span>
            Gana la jornada quien más partidos acierte. Si empatan, gana quien tenga más puntos.
          </span>
        </li>
      </ol>

      <RouterLink
        to="/reglas"
        class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-mundial-green hover:underline"
      >
        Ver reglas y datos de pago
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </article>
  </section>
</template>
