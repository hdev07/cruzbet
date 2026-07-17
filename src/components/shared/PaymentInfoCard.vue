<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import {
  BASE_PAYMENT_INFO,
  BASE_PAYMENT_NOTES,
} from '@/constants/base-quiniela-rules'

const props = withDefaults(
  defineProps<{
    /** Muestra las notas debajo del bloque bancario */
    showNotes?: boolean
    /** Título de la sección; cadena vacía para ocultarlo */
    title?: string
    /** Con borde y fondo propios (desactivar si ya va dentro de otro contenedor) */
    framed?: boolean
  }>(),
  {
    showNotes: true,
    title: undefined,
    framed: true,
  },
)

const heading = computed(
  () => props.title ?? `Depósito — ${BASE_PAYMENT_INFO.amountLabel}`,
)

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
  <section aria-label="Datos de pago">
    <h2
      v-if="heading"
      class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green"
    >
      {{ heading }}
    </h2>
    <div
      class="space-y-3 text-sm"
      :class="framed ? 'rounded-xl border border-white/10 bg-white/5 p-4' : ''"
    >
      <p>
        <span class="text-slate-500">Beneficiario:</span>
        {{ BASE_PAYMENT_INFO.beneficiary }}
      </p>
      <p>
        <span class="text-slate-500">Banco:</span>
        {{ BASE_PAYMENT_INFO.bank }}
      </p>
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
    <ul
      v-if="showNotes && BASE_PAYMENT_NOTES.length"
      class="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500"
    >
      <li v-for="note in BASE_PAYMENT_NOTES" :key="note">{{ note }}</li>
    </ul>
  </section>
</template>
