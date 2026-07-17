<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import GroupedBarChart from '@/components/charts/GroupedBarChart.vue'
import RankedBarList from '@/components/charts/RankedBarList.vue'
import { useTablasStore } from '@/stores/tablasStore'

const store = useTablasStore()
const { jornadaBuckets, minuteBuckets, fairPlayTable, selectedJornada } = storeToRefs(store)

const jornadaCategories = computed(() => jornadaBuckets.value.map((b) => `J${b.jornada}`))
const jornadaSelectedIndex = computed(() =>
  typeof selectedJornada.value === 'number' ? selectedJornada.value - 1 : null,
)

const cardSeries = computed(() => [
  {
    key: 'yellow',
    label: 'Amarillas',
    color: 'var(--color-mundial-warning)',
    values: jornadaBuckets.value.map((b) => b.yellow),
  },
  {
    key: 'red',
    label: 'Rojas',
    color: 'var(--color-mundial-error)',
    values: jornadaBuckets.value.map((b) => b.red),
  },
])

const foulsSeries = computed(() => [
  {
    key: 'fouls',
    label: 'Faltas',
    color: 'var(--color-mundial-gold)',
    values: jornadaBuckets.value.map((b) => b.fouls),
  },
])

const minuteCategories = computed(() => minuteBuckets.value.map((b) => b.label))
const minuteSeries = computed(() => [
  {
    key: 'yellow',
    label: 'Amarillas',
    color: 'var(--color-mundial-warning)',
    values: minuteBuckets.value.map((b) => b.yellow),
  },
  {
    key: 'red',
    label: 'Rojas',
    color: 'var(--color-mundial-error)',
    values: minuteBuckets.value.map((b) => b.red),
  },
])

const topOffenders = computed(() =>
  [...fairPlayTable.value]
    .sort((a, b) => b.yellow + b.red - (a.yellow + a.red))
    .slice(0, 8)
    .map((row) => ({
      code: row.teamCode,
      name: row.teamName,
      value: row.yellow,
      secondaryValue: row.red,
    })),
)

function selectJornada(index: number) {
  const jornada = index + 1
  store.selectedJornada = store.selectedJornada === jornada ? 'torneo' : jornada
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-4">
        <h3 class="text-sm font-semibold text-app-text">Tarjetas por Jornada</h3>
        <p class="mt-1 text-xs text-app-muted">
          Toca una jornada para ver su detalle en Fair Play
        </p>
      </header>
      <GroupedBarChart
        :categories="jornadaCategories"
        :series="cardSeries"
        :selected-index="jornadaSelectedIndex"
        @select="selectJornada"
      />
    </section>

    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-4">
        <h3 class="text-sm font-semibold text-app-text">Faltas por Jornada</h3>
        <p class="mt-1 text-xs text-app-muted">Total de faltas marcadas en cada jornada</p>
      </header>
      <GroupedBarChart
        :categories="jornadaCategories"
        :series="foulsSeries"
        :selected-index="jornadaSelectedIndex"
        @select="selectJornada"
      />
    </section>

    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-4">
        <h3 class="text-sm font-semibold text-app-text">Tarjetas por Periodo de Juego</h3>
        <p class="mt-1 text-xs text-app-muted">Distribución de amonestaciones por minuto</p>
      </header>
      <GroupedBarChart :categories="minuteCategories" :series="minuteSeries" />
    </section>

    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-4">
        <h3 class="text-sm font-semibold text-app-text">Disciplina por Club</h3>
        <p class="mt-1 text-xs text-app-muted">Clubes con más tarjetas acumuladas</p>
      </header>
      <RankedBarList
        v-if="topOffenders.length"
        :rows="topOffenders"
        primary-color="var(--color-mundial-warning)"
        secondary-color="var(--color-mundial-error)"
        primary-label="Amarillas"
        secondary-label="Rojas"
      />
      <p v-else class="py-6 text-center text-sm text-app-muted">Aún no hay tarjetas registradas.</p>
    </section>
  </div>
</template>
