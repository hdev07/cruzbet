<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_PAYMENT_INFO,
  BASE_QUINIELA_LOGIC,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_POINTS_PER_HIT,
} from '@/constants/base-quiniela-rules'
import { QUINIELA_MODE_BASE } from '@/constants/quiniela-modes'
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
    <QuinielaModeBanner />

    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Reglas y pagos</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ QUINIELA_MODE_BASE.entryLabel }} · {{ BASE_QUINIELA_MATCHES_PER_ROUND }} partidos por jornada
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
          Máximo por jornada:
          <strong class="text-slate-300">
            {{ BASE_QUINIELA_MATCHES_PER_ROUND * BASE_QUINIELA_POINTS_PER_HIT }} pts
          </strong>
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
        <div class="flex items-center justify-between gap-2">
          <span><span class="text-slate-500">Cuenta:</span> {{ BASE_PAYMENT_INFO.accountNumberDisplay }}</span>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
            @click="copyValue(BASE_PAYMENT_INFO.accountNumber, 'account')"
          >
            <Check v-if="copiedField === 'account'" class="h-4 w-4 text-mundial-green" />
            <Copy v-else class="h-4 w-4" />
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span><span class="text-slate-500">CLABE:</span> {{ BASE_PAYMENT_INFO.clabeDisplay }}</span>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
            @click="copyValue(BASE_PAYMENT_INFO.clabe, 'clabe')"
          >
            <Check v-if="copiedField === 'clabe'" class="h-4 w-4 text-mundial-green" />
            <Copy v-else class="h-4 w-4" />
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
