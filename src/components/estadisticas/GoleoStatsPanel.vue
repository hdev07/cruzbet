<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import RankedBarList from '@/components/charts/RankedBarList.vue'
import { useTablasStore } from '@/stores/tablasStore'

const store = useTablasStore()
const { scorers } = storeToRefs(store)

const rows = computed(() =>
  scorers.value.map((row) => ({
    code: row.teamCode,
    name: row.playerName,
    subtitle: row.teamName,
    value: row.goals,
  })),
)

const totalGoals = computed(() => scorers.value.reduce((sum, row) => sum + row.goals, 0))
</script>

<template>
  <section class="rounded-2xl border border-app-border bg-app-surface p-4">
    <header class="mb-4">
      <h3 class="text-sm font-semibold text-app-text">Máximos Goleadores</h3>
      <p class="mt-1 text-xs text-app-muted">
        Top {{ rows.length }} jugadores del torneo · {{ totalGoals }} goles entre ellos
      </p>
    </header>

    <RankedBarList
      v-if="rows.length"
      :rows="rows"
      primary-color="var(--color-mundial-accent)"
    />
    <p v-else class="py-6 text-center text-sm text-app-muted">Aún no hay goles registrados.</p>
  </section>
</template>
