<script setup lang="ts">
import { ref } from 'vue'
import { Check, CircleDot, Copy } from '@lucide/vue'
import {
  ENTRY_FEE_MXN,
  GOAL_MINUTE_GRID_LOGIC,
  GOAL_SECOND_SCORING_LOGIC,
  HOW_IT_WORKS,
  PAYMENT_INFO,
  PAYMENT_NOTES,
  GLOBAL_WINNER_LOGIC,
  MATCH_WINNER_LOGIC,
  PREDICTIONS_LOGIC,
  PREDICTION_LIMITS,
  SCORE_SCORING_RULES,
  SCORING_RULES,
  WINNER_PREDICTION_LOGIC,
} from '@/constants/quiniela-rules'
import QuinielaModeBanner from '@/components/layout/QuinielaModeBanner.vue'
import SimpleRuleExampleCard from '@/components/shared/SimpleRuleExampleCard.vue'
import { QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'

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
    <p class="mb-6 text-sm text-slate-400 lg:text-base">
      {{ QUINIELA_MODE_PARTIDO.title }} · ${{ ENTRY_FEE_MXN }} MXN por partido · depósito a cuenta bancaria
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
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        {{ PREDICTIONS_LOGIC.title }}
      </h2>
      <p class="mb-4 text-sm text-slate-400">{{ PREDICTIONS_LOGIC.summary }}</p>
      <ol class="mb-6 space-y-3">
        <li
          v-for="(step, index) in PREDICTIONS_LOGIC.steps"
          :key="step.title"
          class="flex gap-3 rounded-xl border border-mundial-accent/20 bg-mundial-accent/5 p-4"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mundial-accent/20 text-sm font-bold text-mundial-accent"
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
        {{ GOAL_MINUTE_GRID_LOGIC.title }}
      </h2>
      <p class="mb-4 text-sm text-slate-400">{{ GOAL_MINUTE_GRID_LOGIC.summary }}</p>
      <div class="mb-4 grid gap-3 sm:grid-cols-2">
        <div
          v-for="half in GOAL_MINUTE_GRID_LOGIC.halves"
          :key="half.title"
          class="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <p class="font-semibold text-slate-200">{{ half.title }}</p>
          <p class="mt-1 text-sm text-slate-400">{{ half.description }}</p>
        </div>
      </div>
      <ul class="space-y-2 text-sm text-slate-400">
        <li v-for="note in GOAL_MINUTE_GRID_LOGIC.notes" :key="note" class="flex gap-2">
          <CircleDot class="mt-0.5 h-4 w-4 shrink-0 text-mundial-accent" />
          <span>{{ note }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-400">
        {{ GOAL_SECOND_SCORING_LOGIC.title }}
      </h2>
      <div class="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p class="text-sm text-amber-100">{{ GOAL_SECOND_SCORING_LOGIC.summary }}</p>
        <p class="mt-2 text-sm font-semibold text-amber-200">{{ GOAL_SECOND_SCORING_LOGIC.rule }}</p>
      </div>
      <div class="mb-4 overflow-x-auto rounded-xl border border-white/10">
        <table class="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr class="bg-black/30 text-left text-xs uppercase tracking-wider text-slate-400">
              <th class="border border-white/10 px-3 py-2">Gol real</th>
              <th class="border border-white/10 px-3 py-2">Cuenta como</th>
              <th class="border border-white/10 px-3 py-2">Gana puntos…</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in GOAL_SECOND_SCORING_LOGIC.examples"
              :key="row.goal"
              class="text-slate-300"
            >
              <td class="border border-white/10 px-3 py-2 font-mono tabular-nums">{{ row.goal }}</td>
              <td class="border border-white/10 px-3 py-2 font-semibold text-mundial-accent">
                {{ row.effective }}
              </td>
              <td class="border border-white/10 px-3 py-2 text-slate-400">{{ row.whoWins }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="space-y-2 text-sm text-slate-400">
        <li v-for="note in GOAL_SECOND_SCORING_LOGIC.notes" :key="note" class="flex gap-2">
          <CircleDot class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>{{ note }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-green">
        {{ WINNER_PREDICTION_LOGIC.title }}
      </h2>
      <p class="mb-4 text-sm text-slate-400">{{ WINNER_PREDICTION_LOGIC.summary }}</p>
      <div class="mb-4 overflow-x-auto rounded-xl border border-white/10">
        <table class="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                v-for="opt in WINNER_PREDICTION_LOGIC.options"
                :key="opt.code"
                class="border border-white/10 bg-black/30 px-3 py-3 text-center"
              >
                <span class="block text-xl font-bold text-mundial-green">{{ opt.code }}</span>
                <span class="mt-0.5 block text-xs font-normal text-slate-400">{{ opt.label }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                v-for="opt in WINNER_PREDICTION_LOGIC.options"
                :key="`desc-${opt.code}`"
                class="border border-white/10 px-3 py-3 text-center text-slate-400"
              >
                {{ opt.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="space-y-2 text-sm text-slate-400">
        <li v-for="note in WINNER_PREDICTION_LOGIC.notes" :key="note" class="flex gap-2">
          <CircleDot class="mt-0.5 h-4 w-4 shrink-0 text-mundial-green" />
          <span>{{ note }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <div class="mb-8 space-y-4">
        <h3 class="text-base font-bold text-mundial-accent">Ejemplos del primer gol</h3>
        <p class="text-sm text-slate-400">Tú dijiste → Pasó esto → Ganas X puntos.</p>
        <SimpleRuleExampleCard
          v-for="example in PREDICTIONS_LOGIC.goalExamples"
          :key="example.id"
          :example="example"
        />
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-bold text-mundial-green">Ejemplos del ganador (L / E / V)</h3>
        <SimpleRuleExampleCard
          v-for="example in PREDICTIONS_LOGIC.scoreExamples"
          :key="example.id"
          :example="example"
        />
      </div>
    </section>

    <div class="mb-8 grid gap-8 lg:grid-cols-2">
      <section>
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
            <strong
              class="text-mundial-accent"
              :class="typeof limit.value === 'number' ? 'tabular-nums' : 'text-right text-xs'"
            >
              {{ limit.value }}
            </strong>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Puntos — minuto del primer gol
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
    </div>

    <div class="mb-8 grid gap-8 lg:grid-cols-2">
      <section>
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

      <section>
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
    </div>

    <section>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Puntos — ganador (L/E/V)
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
      <p class="mt-3 text-sm text-slate-400">
        Al terminar el partido se revisan ambas predicciones por separado. Lo que aciertas suma; lo que fallas vale 0.
        El minuto del gol usa la regla de 30 segundos para obtener el minuto efectivo antes de calcular puntos.
      </p>
    </section>
  </div>
</template>
