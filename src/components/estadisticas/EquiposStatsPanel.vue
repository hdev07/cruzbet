<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import RankedBarList from '@/components/charts/RankedBarList.vue'
import { useTablasStore } from '@/stores/tablasStore'

const store = useTablasStore()
const { standings } = storeToRefs(store)

const played = computed(() => standings.value.filter((row) => row.played > 0))

const bestAttack = computed(() =>
  [...played.value]
    .sort((a, b) => b.goalsFor - a.goalsFor)
    .slice(0, 8)
    .map((row) => ({ code: row.teamCode, name: row.teamName, value: row.goalsFor })),
)

const bestDefense = computed(() =>
  [...played.value]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
    .slice(0, 8)
    .map((row) => ({ code: row.teamCode, name: row.teamName, value: row.goalsAgainst })),
)
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-4">
        <h3 class="text-sm font-semibold text-app-text">Ofensiva</h3>
        <p class="mt-1 text-xs text-app-muted">Equipos con más goles anotados</p>
      </header>
      <RankedBarList
        v-if="bestAttack.length"
        :rows="bestAttack"
        primary-color="var(--color-mundial-accent)"
        unit=" GF"
      />
      <p v-else class="py-6 text-center text-sm text-app-muted">Aún no hay partidos jugados.</p>
    </section>

    <section class="rounded-2xl border border-app-border bg-app-surface p-4">
      <header class="mb-4">
        <h3 class="text-sm font-semibold text-app-text">Defensiva</h3>
        <p class="mt-1 text-xs text-app-muted">Equipos con menos goles recibidos</p>
      </header>
      <RankedBarList
        v-if="bestDefense.length"
        :rows="bestDefense"
        primary-color="var(--color-mundial-accent)"
        unit=" GC"
      />
      <p v-else class="py-6 text-center text-sm text-app-muted">Aún no hay partidos jugados.</p>
    </section>
  </div>
</template>
