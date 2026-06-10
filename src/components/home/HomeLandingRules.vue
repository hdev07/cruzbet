<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import { QUINIELA_MODE_BASE, QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'
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

    <div class="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <!-- Quiniela base -->
      <article class="rounded-2xl border border-mundial-green/30 bg-mundial-green/5 p-6">
        <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-mundial-green">
              Principal
            </p>
            <h3 class="text-xl font-bold text-slate-100">{{ QUINIELA_MODE_BASE.title }}</h3>
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
          :to="`${QUINIELA_MODE_BASE.homePath}/reglas`"
          class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-mundial-green hover:underline"
        >
          Ver reglas y datos de pago
          <ChevronRight class="h-4 w-4" />
        </RouterLink>
      </article>

      <!-- Quiniela por partido -->
      <article class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Extra</p>
            <h3 class="text-xl font-bold text-slate-100">{{ QUINIELA_MODE_PARTIDO.title }}</h3>
            <p class="mt-1 text-xs text-slate-500">Opcional · aparte de la quiniela base</p>
          </div>
          <span class="rounded-full border border-white/10 px-3 py-1 text-sm font-medium text-slate-400">
            ${{ ENTRY_FEE_MXN }} / partido
          </span>
        </div>

        <ol class="space-y-4 text-sm leading-relaxed text-slate-400">
          <li class="flex gap-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400"
            >
              1
            </span>
            <span>
              Pagas <strong class="text-slate-300">${{ ENTRY_FEE_MXN }} pesos</strong> por cada partido
              que quieras jugar (no todos, solo los que elijas).
            </span>
          </li>
          <li class="flex gap-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400"
            >
              2
            </span>
            <span>
              Tienes que adivinar <strong class="text-slate-300">dos cosas</strong> antes de que empiece
              el partido: en qué <strong class="text-slate-300">minuto cae el primer gol</strong> (o
              marcar «sin goles») y quién gana (<strong class="text-slate-300">L, E o V</strong>).
            </span>
          </li>
          <li class="flex gap-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400"
            >
              3
            </span>
            <span>
              Si aciertas el minuto exacto o el ganador, sumas puntos. Si fallas, vale 0.
            </span>
          </li>
          <li class="flex gap-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400"
            >
              4
            </span>
            <span>
              Ojo: si el gol cae a mitad del minuto (ej. 34:45), cuenta como minuto
              <strong class="text-slate-300">35</strong>. Tú solo eliges minutos, no segundos.
            </span>
          </li>
        </ol>

        <RouterLink
          :to="`${QUINIELA_MODE_PARTIDO.homePath}/reglas`"
          class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-mundial-accent hover:underline"
        >
          Ver reglas y datos de pago
          <ChevronRight class="h-4 w-4" />
        </RouterLink>
      </article>
    </div>
  </section>
</template>
