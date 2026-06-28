<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_PAYMENT_INFO,
  BASE_QUINIELA_LOGIC,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { QUINIELA_SUMMARY } from '@/constants/nav'
import { PAYMENT_NOTES } from '@/constants/quiniela-rules'

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
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Reglas y pagos</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ QUINIELA_SUMMARY.entryLabel }} · grupos (16) y eliminatoria por ronda
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
        Puntuación
      </h2>
      <ul class="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <li v-for="rule in BASE_QUINIELA_LOGIC.scoring" :key="rule.label" class="text-sm text-slate-300">
          {{ rule.label }}:
          <strong class="text-mundial-green">{{ rule.points }} pts</strong>
        </li>
        <li class="text-sm text-slate-500">
          Máximo en grupos (16 partidos):
          <strong class="text-slate-300">
            {{ BASE_QUINIELA_MATCHES_PER_ROUND * BASE_QUINIELA_POINTS_PER_HIT }} pts
          </strong>
          · en eliminatoria depende de la jornada
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        Depósito — {{ BASE_PAYMENT_INFO.amountLabel }}
      </h2>
      <div class="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 text-sm">
        <p><span class="text-slate-500">Beneficiario:</span> {{ BASE_PAYMENT_INFO.beneficiary }}</p>
        <p><span class="text-slate-500">Banco:</span> {{ BASE_PAYMENT_INFO.bank }}</p>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">Cuenta</p>
            <p class="font-mono text-sm font-medium tracking-wide text-slate-200">
              {{ BASE_PAYMENT_INFO.accountNumberDisplay }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
            @click="copyValue(BASE_PAYMENT_INFO.accountNumber, 'account')"
          >
            <Check v-if="copiedField === 'account'" class="h-3.5 w-3.5 text-mundial-green" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedField === 'account' ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <div class="flex items-start justify-between gap-3 border-t border-white/10 pt-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">CLABE</p>
            <p class="font-mono text-sm font-medium tracking-wide text-slate-200">
              {{ BASE_PAYMENT_INFO.clabeDisplay }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
            @click="copyValue(BASE_PAYMENT_INFO.clabe, 'clabe')"
          >
            <Check v-if="copiedField === 'clabe'" class="h-3.5 w-3.5 text-mundial-green" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copiedField === 'clabe' ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <p class="text-xs text-slate-500">{{ BASE_PAYMENT_INFO.concept }}</p>
      </div>
      <ul v-if="PAYMENT_NOTES?.length" class="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
        <li v-for="note in PAYMENT_NOTES" :key="note">{{ note }}</li>
      </ul>
    </section>
  </div>
</template>
