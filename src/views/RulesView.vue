<script setup lang="ts">
import { ref } from 'vue'
import { Check, CircleDot, Copy } from '@lucide/vue'
import {
  ENTRY_FEE_MXN,
  HOW_IT_WORKS,
  PAYMENT_INFO,
  PAYMENT_NOTES,
  GLOBAL_WINNER_LOGIC,
  MATCH_WINNER_LOGIC,
  PREDICTION_LIMITS,
  SCORE_SCORING_RULES,
  SCORING_RULES,
} from '@/constants/quiniela-rules'

const copiedField = ref<string | null>(null)

async function copyValue(value: string, field: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedField.value = field
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null
    }, 2000)
  } catch {
    copiedField.value = null
  }
}
</script>

<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold">Reglas y pagos</h1>
    <p class="mb-6 text-sm text-slate-400">
      Cuota de ${{ ENTRY_FEE_MXN }} MXN por partido · depósito a cuenta bancaria
    </p>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        Cómo funciona
      </h2>
      <ol class="space-y-3">
        <li
          v-for="(step, index) in HOW_IT_WORKS"
          :key="step.title"
          class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mundial-accent text-sm font-bold text-white"
          >
            {{ index + 1 }}
          </span>
          <div>
            <p class="font-semibold text-slate-200">{{ step.title }}</p>
            <p class="mt-0.5 text-sm text-slate-400">{{ step.description }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        Cuota de entrada
      </h2>
      <div class="rounded-xl border border-mundial-green/30 bg-mundial-green/10 p-5 text-center">
        <p class="text-4xl font-bold tabular-nums text-mundial-green">${{ ENTRY_FEE_MXN }}</p>
        <p class="mt-1 text-sm text-slate-300">pesos mexicanos por partido</p>
      </div>
      <ul class="mt-4 space-y-2 text-sm text-slate-400">
        <li v-for="note in PAYMENT_NOTES" :key="note" class="flex gap-2">
          <CircleDot class="mt-0.5 h-4 w-4 shrink-0 text-mundial-accent" />
          <span>{{ note }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Datos para depósito
      </h2>
      <div class="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <p class="text-xs text-slate-500">Beneficiario</p>
          <p class="font-medium text-slate-200">{{ PAYMENT_INFO.beneficiary }}</p>
        </div>

        <div>
          <p class="text-xs text-slate-500">Banco</p>
          <p class="font-medium text-slate-200">{{ PAYMENT_INFO.bank }}</p>
        </div>

        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">Número de cuenta (Banco Azteca)</p>
            <p class="font-mono text-sm font-medium tracking-wide text-slate-200">
              {{ PAYMENT_INFO.accountNumberDisplay }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
            @click="copyValue(PAYMENT_INFO.accountNumber, 'account')"
          >
            <Check v-if="copiedField === 'account'" class="h-3.5 w-3.5" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedField === 'account' ? 'Copiado' : 'Copiar' }}
          </button>
        </div>

        <div class="flex items-start justify-between gap-3 border-t border-white/10 pt-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">CLABE interbancaria (SPEI desde otro banco)</p>
            <p class="font-mono text-sm font-medium tracking-wide text-slate-200">
              {{ PAYMENT_INFO.clabeDisplay }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
            @click="copyValue(PAYMENT_INFO.clabe, 'clabe')"
          >
            <Check v-if="copiedField === 'clabe'" class="h-3.5 w-3.5" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedField === 'clabe' ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Límites por partido
      </h2>
      <ul class="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <li
          v-for="limit in PREDICTION_LIMITS"
          :key="limit.label"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-slate-400">{{ limit.label }}</span>
          <strong class="tabular-nums text-mundial-accent">{{ limit.value }}</strong>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Puntos — predicción de gol
      </h2>
      <ul class="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <li
          v-for="rule in SCORING_RULES"
          :key="rule.label"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-slate-400">{{ rule.label }}</span>
          <strong class="tabular-nums text-mundial-accent">{{ rule.points }} pts</strong>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        {{ MATCH_WINNER_LOGIC.title }}
      </h2>
      <p class="mb-4 text-sm text-slate-400">{{ MATCH_WINNER_LOGIC.summary }}</p>
      <ol class="space-y-3">
        <li
          v-for="(step, index) in MATCH_WINNER_LOGIC.steps"
          :key="step.title"
          class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mundial-green/20 text-sm font-bold text-mundial-green"
          >
            {{ index + 1 }}
          </span>
          <div>
            <p class="font-semibold text-slate-200">{{ step.title }}</p>
            <p class="mt-0.5 text-sm text-slate-400">{{ step.description }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
        {{ GLOBAL_WINNER_LOGIC.title }}
      </h2>
      <p class="mb-4 text-sm text-slate-400">{{ GLOBAL_WINNER_LOGIC.summary }}</p>
      <ol class="space-y-3">
        <li
          v-for="(step, index) in GLOBAL_WINNER_LOGIC.steps"
          :key="step.title"
          class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-slate-300"
          >
            {{ index + 1 }}
          </span>
          <div>
            <p class="font-semibold text-slate-200">{{ step.title }}</p>
            <p class="mt-0.5 text-sm text-slate-400">{{ step.description }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Puntos — marcador final
      </h2>
      <ul class="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <li
          v-for="rule in SCORE_SCORING_RULES"
          :key="rule.label"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-slate-400">{{ rule.label }}</span>
          <strong class="tabular-nums text-mundial-accent">{{ rule.points }} pts</strong>
        </li>
      </ul>
      <p class="mt-3 text-xs text-slate-500">
        Los puntos se calculan al finalizar el partido. Cada predicción de gol se compara con todos los goles reales
        (se toma la mejor coincidencia). Cada marcador se evalúa por separado.
      </p>
    </section>
  </div>
</template>
