<script setup lang="ts">
import { ref } from 'vue'
import { CircleDot, ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import {
  ENTRY_FEE_MXN,
  GLOBAL_WINNER_LOGIC,
  GOAL_MINUTE_GRID_LOGIC,
  GOAL_SECOND_SCORING_LOGIC,
  HOW_IT_WORKS,
  MATCH_WINNER_LOGIC,
  PREDICTION_LIMITS,
  PREDICTIONS_LOGIC,
  SCORE_SCORING_RULES,
  SCORING_RULES,
  WINNER_PREDICTION_LOGIC,
} from '@/constants/quiniela-rules'
import {
  BASE_ENTRY_FEE_MXN,
  BASE_QUINIELA_LOGIC,
  BASE_QUINIELA_MATCHES_PER_ROUND,
  BASE_QUINIELA_MAX_POINTS,
} from '@/constants/base-quiniela-rules'
import { QUINIELA_MODE_BASE, QUINIELA_MODE_PARTIDO } from '@/constants/quiniela-modes'

type RulesTab = 'partido' | 'base'
const activeTab = ref<RulesTab>('partido')
</script>

<template>
  <section class="mb-10">
    <div class="mb-6 text-center">
      <h2 class="text-lg font-bold text-slate-100 lg:text-xl">¿Cómo funciona?</h2>
      <p class="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
        Dos modalidades independientes: cada una con su cuota, ranking e historial.
        Aquí tienes las reglas básicas; en cada quiniela encontrarás el detalle completo.
      </p>
    </div>

    <div class="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition"
        :class="
          activeTab === 'partido'
            ? 'bg-mundial-accent text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        "
        @click="activeTab = 'partido'"
      >
        {{ QUINIELA_MODE_PARTIDO.shortTitle }}
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition"
        :class="
          activeTab === 'base'
            ? 'bg-mundial-green text-mundial-dark shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        "
        @click="activeTab = 'base'"
      >
        {{ QUINIELA_MODE_BASE.shortTitle }}
      </button>
    </div>

    <!-- Quiniela por partido -->
    <div v-show="activeTab === 'partido'" class="space-y-6">
      <div class="rounded-xl border border-mundial-accent/20 bg-mundial-accent/5 p-4 text-center">
        <p class="text-2xl font-bold text-mundial-accent">${{ ENTRY_FEE_MXN }} MXN</p>
        <p class="mt-0.5 text-sm text-slate-300">por partido · {{ QUINIELA_MODE_PARTIDO.tagline }}</p>
      </div>

      <div>
        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          Pasos generales
        </h3>
        <ol class="space-y-2">
          <li
            v-for="(step, index) in HOW_IT_WORKS"
            :key="step.title"
            class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-accent/20 text-xs font-bold text-mundial-accent"
            >
              {{ index + 1 }}
            </span>
            <div>
              <p class="text-sm font-semibold text-slate-200">{{ step.title }}</p>
              <p class="mt-0.5 text-xs text-slate-400">{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </div>

      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          {{ PREDICTIONS_LOGIC.title }}
        </h3>
        <p class="mb-3 text-sm text-slate-400">{{ PREDICTIONS_LOGIC.summary }}</p>
        <ol class="space-y-2">
          <li
            v-for="(step, index) in PREDICTIONS_LOGIC.steps"
            :key="step.title"
            class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400"
            >
              {{ index + 1 }}
            </span>
            <div>
              <p class="text-sm font-semibold text-slate-200">{{ step.title }}</p>
              <p class="mt-0.5 text-xs text-slate-400">{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </div>

      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          {{ GOAL_MINUTE_GRID_LOGIC.title }}
        </h3>
        <p class="mb-3 text-sm text-slate-400">{{ GOAL_MINUTE_GRID_LOGIC.summary }}</p>
        <div class="mb-3 grid gap-2 sm:grid-cols-2">
          <div
            v-for="half in GOAL_MINUTE_GRID_LOGIC.halves"
            :key="half.title"
            class="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <p class="text-sm font-semibold text-slate-200">{{ half.title }}</p>
            <p class="mt-0.5 text-xs text-slate-400">{{ half.description }}</p>
          </div>
        </div>
        <ul class="space-y-1.5 text-xs text-slate-400">
          <li v-for="note in GOAL_MINUTE_GRID_LOGIC.notes" :key="note" class="flex gap-2">
            <CircleDot class="mt-0.5 h-3.5 w-3.5 shrink-0 text-mundial-accent" />
            <span>{{ note }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          {{ GOAL_SECOND_SCORING_LOGIC.title }}
        </h3>
        <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p class="text-sm text-amber-100">{{ GOAL_SECOND_SCORING_LOGIC.summary }}</p>
          <p class="mt-1.5 text-sm font-semibold text-amber-200">{{ GOAL_SECOND_SCORING_LOGIC.rule }}</p>
        </div>
        <ul class="mt-3 space-y-1.5 text-xs text-slate-400">
          <li v-for="note in GOAL_SECOND_SCORING_LOGIC.notes" :key="note" class="flex gap-2">
            <CircleDot class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>{{ note }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-mundial-green">
          {{ WINNER_PREDICTION_LOGIC.title }}
        </h3>
        <p class="mb-3 text-sm text-slate-400">{{ WINNER_PREDICTION_LOGIC.summary }}</p>
        <div class="mb-3 grid gap-2 sm:grid-cols-3">
          <div
            v-for="opt in WINNER_PREDICTION_LOGIC.options"
            :key="opt.code"
            class="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
          >
            <span class="text-xl font-bold text-mundial-green">{{ opt.code }}</span>
            <p class="mt-0.5 text-xs font-semibold text-slate-300">{{ opt.label }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ opt.description }}</p>
          </div>
        </div>
        <ul class="space-y-1.5 text-xs text-slate-400">
          <li v-for="note in WINNER_PREDICTION_LOGIC.notes" :key="note" class="flex gap-2">
            <CircleDot class="mt-0.5 h-3.5 w-3.5 shrink-0 text-mundial-green" />
            <span>{{ note }}</span>
          </li>
        </ul>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Límites por partido
          </h3>
          <ul class="space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <li
              v-for="limit in PREDICTION_LIMITS"
              :key="limit.label"
              class="flex items-center justify-between gap-2"
            >
              <span class="text-slate-400">{{ limit.label }}</span>
              <strong class="text-mundial-accent">{{ limit.value }}</strong>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Puntos
          </h3>
          <ul class="space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <li
              v-for="rule in [...SCORING_RULES, ...SCORE_SCORING_RULES]"
              :key="rule.label"
              class="flex items-center justify-between gap-2"
            >
              <span class="text-xs text-slate-400">{{ rule.label }}</span>
              <strong class="shrink-0 tabular-nums text-mundial-accent">{{ rule.points }} pts</strong>
            </li>
          </ul>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-mundial-green">
            {{ MATCH_WINNER_LOGIC.title }}
          </h3>
          <p class="mb-3 text-xs text-slate-400">{{ MATCH_WINNER_LOGIC.summary }}</p>
          <ol class="space-y-2">
            <li
              v-for="(step, index) in MATCH_WINNER_LOGIC.steps"
              :key="step.title"
              class="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <span class="shrink-0 text-xs font-bold text-mundial-green">{{ index + 1 }}.</span>
              <div>
                <p class="text-sm font-semibold text-slate-200">{{ step.title }}</p>
                <p class="mt-0.5 text-xs text-slate-400">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </div>
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            {{ GLOBAL_WINNER_LOGIC.title }}
          </h3>
          <p class="mb-3 text-xs text-slate-400">{{ GLOBAL_WINNER_LOGIC.summary }}</p>
          <ol class="space-y-2">
            <li
              v-for="(step, index) in GLOBAL_WINNER_LOGIC.steps"
              :key="step.title"
              class="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <span class="shrink-0 text-xs font-bold text-slate-400">{{ index + 1 }}.</span>
              <div>
                <p class="text-sm font-semibold text-slate-200">{{ step.title }}</p>
                <p class="mt-0.5 text-xs text-slate-400">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <RouterLink
        :to="`${QUINIELA_MODE_PARTIDO.homePath}/reglas`"
        class="inline-flex items-center gap-1 text-sm font-semibold text-mundial-accent hover:underline"
      >
        Ver reglas y datos de pago completos
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <!-- Quiniela base -->
    <div v-show="activeTab === 'base'" class="space-y-6">
      <div class="rounded-xl border border-mundial-green/20 bg-mundial-green/5 p-4 text-center">
        <p class="text-2xl font-bold text-mundial-green">${{ BASE_ENTRY_FEE_MXN }} MXN</p>
        <p class="mt-0.5 text-sm text-slate-300">
          por jornada · {{ BASE_QUINIELA_MATCHES_PER_ROUND }} partidos · solo L/E/V
        </p>
      </div>

      <p class="text-sm text-slate-400">{{ BASE_QUINIELA_LOGIC.summary }}</p>

      <div>
        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-mundial-green">
          Pasos generales
        </h3>
        <ol class="space-y-2">
          <li
            v-for="(step, index) in BASE_QUINIELA_LOGIC.howItWorks"
            :key="index"
            class="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mundial-green/20 text-xs font-bold text-mundial-green"
            >
              {{ index + 1 }}
            </span>
            <p class="text-sm text-slate-300">{{ step }}</p>
          </li>
        </ol>
      </div>

      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-mundial-green">
          Puntuación
        </h3>
        <ul class="space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <li
            v-for="rule in BASE_QUINIELA_LOGIC.scoring"
            :key="rule.label"
            class="flex items-center justify-between gap-2"
          >
            <span class="text-slate-400">{{ rule.label }}</span>
            <strong class="tabular-nums text-mundial-green">{{ rule.points }} pts</strong>
          </li>
          <li class="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <span class="text-slate-500">Máximo por jornada</span>
            <strong class="tabular-nums text-slate-200">{{ BASE_QUINIELA_MAX_POINTS }} pts</strong>
          </li>
        </ul>
        <p class="mt-3 text-xs text-slate-500">
          El ranking de cada jornada ordena por aciertos; si hay empate, por puntos totales.
        </p>
      </div>

      <RouterLink
        :to="`${QUINIELA_MODE_BASE.homePath}/reglas`"
        class="inline-flex items-center gap-1 text-sm font-semibold text-mundial-green hover:underline"
      >
        Ver reglas y datos de pago completos
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </div>
  </section>
</template>
