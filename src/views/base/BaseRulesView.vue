<script setup lang="ts">
import PaymentInfoCard from '@/components/shared/PaymentInfoCard.vue'
import {
  ADMIN_FEE_TIERS_LABEL,
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_LOGIC,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { QUINIELA_SUMMARY } from '@/constants/nav'
</script>

<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Reglas y pagos</h1>
    <p class="mb-6 text-sm text-slate-400">
      ${{ BASE_ENTRY_FEE_MXN }} MXN por quiniela · {{ QUINIELA_SUMMARY.tagline }}
    </p>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        Cómo funciona
      </h2>
      <ol class="space-y-3">
        <li
          v-for="(step, index) in BASE_QUINIELA_LOGIC.howItWorks"
          :key="index"
          class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mundial-green text-sm font-bold text-mundial-dark"
          >
            {{ index + 1 }}
          </span>
          <p class="text-sm text-slate-300">{{ step }}</p>
        </li>
      </ol>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        Pozo e infraestructura
      </h2>
      <ul class="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
        <li class="text-sm text-slate-300">
          Del recaudado (solo depósitos verificados), un porcentaje cubre
          <strong class="text-slate-200"> infraestructura</strong>
          (hosting y app) y el resto va al
          <strong class="text-mundial-accent"> pozo</strong>.
        </li>
        <li class="text-sm text-slate-300">
          Tramos:
          <strong class="text-mundial-green">{{ ADMIN_FEE_TIERS_LABEL }}</strong>.
          Entre más jugadores, menor %.
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        Puntuación
      </h2>
      <ul class="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
        <li class="text-sm text-slate-300">
          Acierto L/E/V:
          <strong class="text-mundial-green">{{ BASE_QUINIELA_POINTS_PER_HIT }} pts</strong>
        </li>
        <li class="text-sm text-slate-300">
          Fallo: <strong class="text-slate-400">0 pts</strong>
        </li>
        <li class="text-sm text-slate-500">
          El ranking ordena por aciertos; en empate, por puntos. Solo cuentan depósitos
          verificados.
        </li>
      </ul>
    </section>

    <PaymentInfoCard class="mb-8" />
  </div>
</template>
