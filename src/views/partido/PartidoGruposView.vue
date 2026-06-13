<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, GitBranch } from '@lucide/vue'
import GroupStandingsTable from '@/components/shared/GroupStandingsTable.vue'
import { ELIMINATORIA_PATH, MUNDIAL_PATH } from '@/constants/nav'
import GroupStandingsSection from '@/components/shared/GroupStandingsSection.vue'
import { useGroupStandingsStore } from '@/stores/groupStandingsStore'

const standingsStore = useGroupStandingsStore()

const finishedMatchesCount = computed(
  () => standingsStore.groupMatches.filter((m) => m.status === 'finished').length,
)

onMounted(() => standingsStore.fetchStandingsData())
</script>

<template>
  <div>
    <RouterLink
      :to="MUNDIAL_PATH"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-mundial-accent"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver al Mundial
    </RouterLink>

    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Grupos</h1>
    <p class="mb-6 text-sm text-slate-400">
      Tablas de posiciones de la fase de grupos del Mundial 2026
    </p>

    <div class="mb-6 grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-slate-400">Grupos</p>
        <p class="text-2xl font-bold tabular-nums">{{ standingsStore.standings.length || 12 }}</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-slate-400">Equipos</p>
        <p class="text-2xl font-bold tabular-nums">{{ standingsStore.teams.length || 48 }}</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-slate-400">Partidos jugados</p>
        <p class="text-2xl font-bold tabular-nums">{{ finishedMatchesCount }}</p>
      </div>
    </div>

    <GroupStandingsSection :show-header="false" class="mb-8" />

    <div class="space-y-6">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Todos los grupos
      </h2>

      <div
        v-for="group in standingsStore.standings"
        :key="group.groupName"
        class="space-y-2"
      >
        <h3 class="text-base font-semibold text-mundial-accent">Grupo {{ group.groupName }}</h3>
        <GroupStandingsTable :rows="group.rows" :group-name="group.groupName" />
      </div>
    </div>

    <div class="mt-8 flex flex-col gap-4 sm:flex-row">
      <RouterLink
        :to="ELIMINATORIA_PATH"
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3 text-sm font-semibold text-mundial-accent transition hover:bg-mundial-accent/20"
      >
        <GitBranch class="h-4 w-4" />
        Ver árbol de eliminatoria
      </RouterLink>
    </div>

    <div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-500 lg:text-sm">
      <p class="mb-2 font-semibold text-slate-300">Criterios de clasificación</p>
      <ul class="list-inside list-disc space-y-1">
        <li>Los 2 primeros de cada grupo avanzan a los dieciseisavos de final.</li>
        <li>Los 8 mejores terceros también clasifican (32 equipos en eliminatoria).</li>
        <li>Orden en la tabla: puntos → diferencia de goles → goles a favor.</li>
        <li>Incluye partidos en vivo (provisional) y finalizados.</li>
      </ul>
    </div>
  </div>
</template>
