<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { useTablasStore } from '@/stores/tablasStore'

const store = useTablasStore()
const {
  selectedJornada,
  selectedClubCode,
  jornadaOptions,
  clubOptions,
  selectedJornadaLabel,
  cardTotals,
  playerCards,
  staffCards,
  cardsPerMatch,
  cardFrequencyMinutes,
  fairPlayTable,
  minuteBuckets,
  jornadaBuckets,
} = storeToRefs(store)
</script>

<template>
  <div class="space-y-8">
    <!-- Resumen tarjetas -->
    <section class="grid gap-3 sm:grid-cols-2">
      <article class="rounded-2xl border border-app-border bg-app-surface-elevated p-4">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          Tarjetas Jugador
        </h3>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p class="text-2xl font-bold tabular-nums text-mundial-warning">{{ playerCards.yellow }}</p>
            <p class="text-xs text-app-muted">Amarillas</p>
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-mundial-error">{{ playerCards.red }}</p>
            <p class="text-xs text-app-muted">Rojas</p>
          </div>
        </div>
      </article>
      <article class="rounded-2xl border border-app-border bg-app-surface-elevated p-4">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">
          Tarjetas Cuerpo Técnico
        </h3>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p class="text-2xl font-bold tabular-nums text-mundial-warning">{{ staffCards.yellow }}</p>
            <p class="text-xs text-app-muted">Amarillas</p>
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-mundial-error">{{ staffCards.red }}</p>
            <p class="text-xs text-app-muted">Rojas</p>
          </div>
        </div>
      </article>
    </section>

    <!-- Selector jornada -->
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-3">
        <h3 class="text-sm font-semibold text-app-text">Promedio de Tarjetas</h3>
        <p class="mt-1 text-xs text-app-muted">
          Seleccione una Jornada para mostrar el total de Tarjetas Amarillas o Rojas
        </p>
      </header>

      <div class="mb-4 flex gap-1.5 overflow-x-auto app-scrollbar pb-1">
        <button
          v-for="opt in jornadaOptions"
          :key="String(opt.value)"
          type="button"
          class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
          :class="
            selectedJornada === opt.value
              ? 'bg-mundial-accent text-mundial-dark'
              : 'bg-app-surface-elevated text-app-muted hover:text-app-text'
          "
          @click="selectedJornada = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-app-border bg-app-surface-elevated p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-mundial-warning">
            Tarjetas Amarillas
          </p>
          <p class="mt-2 text-3xl font-bold tabular-nums text-mundial-warning">
            {{ cardTotals.yellow }}
          </p>
          <p class="mt-1 text-xs text-app-muted">
            {{ cardsPerMatch.yellow }} Por Partido
          </p>
        </div>
        <div class="rounded-xl border border-app-border bg-app-surface-elevated p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-mundial-error">
            Tarjetas Rojas
          </p>
          <p class="mt-2 text-3xl font-bold tabular-nums text-mundial-error">
            {{ cardTotals.red }}
          </p>
          <p class="mt-1 text-xs text-app-muted">
            {{ cardsPerMatch.red }} Por Partido
          </p>
        </div>
      </div>
    </section>

    <!-- Frecuencia -->
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-3">
        <h3 class="text-sm font-semibold text-app-text">Frecuencia de Tarjetas</h3>
        <p class="mt-1 text-xs text-app-muted">
          Seleccione una Jornada para mostrar la frecuencia en minutos de Tarjetas Amarillas o Rojas
        </p>
      </header>

      <div class="mb-4 flex gap-1.5 overflow-x-auto app-scrollbar pb-1">
        <button
          v-for="opt in jornadaOptions"
          :key="`freq-${opt.value}`"
          type="button"
          class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
          :class="
            selectedJornada === opt.value
              ? 'bg-mundial-accent text-mundial-dark'
              : 'bg-app-surface-elevated text-app-muted hover:text-app-text'
          "
          @click="selectedJornada = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-app-border bg-app-surface-elevated p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-mundial-warning">
            Tarjetas Amarillas
          </p>
          <p class="mt-2 text-sm text-app-muted">Se amonestó un jugador cada</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-mundial-warning">
            {{ cardFrequencyMinutes.yellow }}
          </p>
          <p class="text-xs text-app-muted">Minutos</p>
        </div>
        <div class="rounded-xl border border-app-border bg-app-surface-elevated p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-mundial-error">
            Tarjetas Rojas
          </p>
          <p class="mt-2 text-sm text-app-muted">Se expulsó un jugador cada</p>
          <p class="mt-1 text-3xl font-bold tabular-nums text-mundial-error">
            {{ cardFrequencyMinutes.red }}
          </p>
          <p class="text-xs text-app-muted">Minutos</p>
        </div>
      </div>
    </section>

    <!-- Conteo por club -->
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-3">
        <h3 class="text-sm font-semibold text-app-text">Conteo de Tarjetas por Club</h3>
        <p class="mt-1 text-xs text-app-muted">
          Seleccione un Club para mostrar su conteo de Tarjetas.
        </p>
      </header>

      <label class="mb-4 block">
        <span class="sr-only">Club</span>
        <select
          v-model="selectedClubCode"
          class="theme-field w-full rounded-xl px-3 py-2.5 text-sm"
        >
          <option v-for="club in clubOptions" :key="club.value" :value="club.value">
            {{ club.label }}
          </option>
        </select>
      </label>

      <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <div
          v-for="row in fairPlayTable"
          :key="`count-${row.teamCode}`"
          class="rounded-xl border border-app-border bg-app-surface-elevated p-2 text-center"
          :class="
            selectedClubCode === row.teamCode || selectedClubCode === 'all'
              ? 'opacity-100'
              : 'opacity-40'
          "
        >
          <p class="text-[0.65rem] font-semibold text-mundial-accent">{{ row.position }}º</p>
          <div class="mt-1 flex justify-center">
            <TeamFlag :code="row.teamCode" :alt="row.teamName" size="sm" />
          </div>
          <p class="mt-1 truncate text-[0.65rem] text-app-muted">{{ row.teamCode }}</p>
          <p class="mt-1 text-sm font-bold tabular-nums text-mundial-warning">{{ row.yellow }}</p>
          <p class="text-sm font-bold tabular-nums text-mundial-error">{{ row.red }}</p>
        </div>
      </div>
    </section>

    <!-- Tabla Fair Play -->
    <section class="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
      <header class="border-b border-app-border px-4 py-3">
        <h3 class="text-sm font-semibold text-app-text">Tabla Fair Play</h3>
        <p class="mt-1 text-xs text-app-muted">
          Seleccione un Club para mostrar su posición en la tabla Fair Play.
        </p>
      </header>
      <div class="overflow-x-auto app-scrollbar">
        <table class="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr class="bg-app-surface-elevated text-left text-xs uppercase tracking-wide text-app-muted">
              <th class="px-3 py-2.5 font-semibold">#</th>
              <th class="px-3 py-2.5 font-semibold">Club</th>
              <th class="px-3 py-2.5 text-center font-semibold text-mundial-warning">Amarillas</th>
              <th class="px-3 py-2.5 text-center font-semibold text-mundial-error">Rojas</th>
              <th class="px-3 py-2.5 text-center font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in fairPlayTable"
              :key="`fp-${row.teamCode}`"
              class="border-t border-app-border/60 transition hover:bg-app-hover"
              :class="
                selectedClubCode === row.teamCode
                  ? 'bg-mundial-accent/10'
                  : ''
              "
              @click="selectedClubCode = row.teamCode"
            >
              <td class="px-3 py-2.5 tabular-nums text-app-muted">{{ row.position }}º</td>
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-2.5">
                  <TeamFlag :code="row.teamCode" :alt="row.teamName" size="sm" />
                  <span class="font-medium">{{ row.teamName }}</span>
                </div>
              </td>
              <td class="px-3 py-2.5 text-center tabular-nums text-mundial-warning">
                {{ row.yellow }}
              </td>
              <td class="px-3 py-2.5 text-center tabular-nums text-mundial-error">
                {{ row.red }}
              </td>
              <td class="px-3 py-2.5 text-center font-bold tabular-nums">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Por periodo de tiempo -->
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-3">
        <h3 class="text-sm font-semibold text-app-text">Tarjetas por Periodo de Tiempo</h3>
        <p class="mt-1 text-xs text-app-muted">
          {{ selectedJornadaLabel }} · Total Amarillas: {{ cardTotals.yellow }} · Rojas:
          {{ cardTotals.red }}
        </p>
      </header>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <div
          v-for="bucket in minuteBuckets"
          :key="bucket.label"
          class="rounded-xl border border-app-border bg-app-surface-elevated p-3 text-center"
        >
          <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-app-muted">
            {{ bucket.label }}
          </p>
          <p class="mt-2 text-lg font-bold tabular-nums text-mundial-warning">{{ bucket.yellow }}</p>
          <p class="text-lg font-bold tabular-nums text-mundial-error">{{ bucket.red }}</p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-4 text-xs text-app-muted">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-mundial-warning" /> Amarillas
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-mundial-error" /> Rojas
        </span>
      </div>
    </section>

    <!-- Faltas y tarjetas por jornada -->
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-3">
        <h3 class="text-sm font-semibold text-app-text">Faltas y tarjetas por Jornada</h3>
        <p class="mt-1 text-xs text-app-muted">
          Todos los Clubes · Amarillas: {{ cardTotals.yellow }} · Rojas: {{ cardTotals.red }} ·
          Faltas: {{ cardTotals.fouls }}
        </p>
      </header>

      <div class="overflow-x-auto app-scrollbar">
        <div class="flex min-w-max gap-2 pb-1">
          <div
            v-for="bucket in jornadaBuckets"
            :key="bucket.jornada"
            class="w-16 shrink-0 rounded-xl border border-app-border bg-app-surface-elevated p-2 text-center"
            :class="
              selectedJornada === bucket.jornada
                ? 'ring-1 ring-mundial-accent'
                : ''
            "
            role="button"
            tabindex="0"
            @click="selectedJornada = bucket.jornada"
            @keydown.enter="selectedJornada = bucket.jornada"
          >
            <p class="text-[0.65rem] font-semibold text-mundial-accent">J{{ bucket.jornada }}</p>
            <p class="mt-1 text-sm font-bold tabular-nums text-mundial-warning">{{ bucket.yellow }}</p>
            <p class="text-sm font-bold tabular-nums text-mundial-error">{{ bucket.red }}</p>
            <p class="text-sm font-bold tabular-nums text-app-muted">{{ bucket.fouls }}</p>
          </div>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-4 text-xs text-app-muted">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-mundial-warning" /> Amarillas
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-mundial-error" /> Rojas
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-app-muted" /> Faltas
        </span>
      </div>

      <div
        v-if="selectedJornada !== 'torneo'"
        class="mt-4 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3 text-sm"
      >
        <p class="font-semibold text-mundial-accent">Jornada: {{ selectedJornada }}</p>
        <p class="mt-1 text-app-muted">
          Tarjetas Amarillas:
          <span class="font-semibold text-app-text">
            {{ jornadaBuckets.find((b) => b.jornada === selectedJornada)?.yellow ?? 0 }}
          </span>
        </p>
        <p class="text-app-muted">
          Tarjetas Rojas:
          <span class="font-semibold text-app-text">
            {{ jornadaBuckets.find((b) => b.jornada === selectedJornada)?.red ?? 0 }}
          </span>
        </p>
        <p class="text-app-muted">
          Faltas:
          <span class="font-semibold text-app-text">
            {{ jornadaBuckets.find((b) => b.jornada === selectedJornada)?.fouls ?? 0 }}
          </span>
        </p>
      </div>
    </section>
  </div>
</template>
