<script setup lang="ts">
import { computed, onMounted, onActivated, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Table2 } from '@lucide/vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import FairPlayPanel from '@/components/tablas/FairPlayPanel.vue'
import GoleoTable from '@/components/tablas/GoleoTable.vue'
import LoMejorDelTorneo from '@/components/tablas/LoMejorDelTorneo.vue'
import MenoresTable from '@/components/tablas/MenoresTable.vue'
import StandingsTable from '@/components/tablas/StandingsTable.vue'
import { TABLAS_SECTIONS, type TablasSection } from '@/constants/tablas'
import { useTablasStore } from '@/stores/tablasStore'

const store = useTablasStore()
const {
  loading,
  standings,
  scorers,
  menoresStandings,
  menoresRequiredMinutes,
  menoresSyncedAt,
  highlights,
} = storeToRefs(store)

const activeSection = ref<TablasSection>('general')

/** Solo skeleton en la primera carga; si ya hay datos, el refresh no oculta la tabla. */
const showSkeleton = computed(
  () =>
    loading.value &&
    !scorers.value.length &&
    !menoresStandings.value.length &&
    standings.value.every((row) => row.played === 0),
)

const sectionHint = computed(() => {
  switch (activeSection.value) {
    case 'general':
      return 'Posiciones oficiales del Apertura 2026 (incluye partidos en vivo)'
    case 'goleo':
      return 'Máximos anotadores del torneo'
    case 'menores':
      return 'Regla de menores: minutos oficiales publicados por Liga MX'
    case 'fair-play':
      return 'Disciplina, tarjetas y faltas del torneo'
  }
})

function refresh() {
  void store.fetchTablas()
}

onMounted(refresh)
onActivated(refresh)
</script>

<template>
  <div class="w-full">
    <header class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Liga MX · Apertura 2026
      </p>
      <div class="mt-1 flex items-center gap-2">
        <Table2 class="h-7 w-7 text-mundial-accent" :stroke-width="1.75" />
        <h1 class="text-2xl font-bold lg:text-3xl">Tablas</h1>
      </div>
      <p class="mt-2 max-w-2xl text-sm text-app-muted lg:text-base">
        Tabla general, goleo, menores y fair play del torneo.
      </p>
    </header>

    <nav
      class="theme-tab-bar mb-6 flex gap-1 overflow-x-auto app-scrollbar"
      aria-label="Secciones de tablas"
    >
      <button
        v-for="section in TABLAS_SECTIONS"
        :key="section.id"
        type="button"
        class="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition"
        :class="
          activeSection === section.id
            ? 'bg-mundial-accent text-mundial-dark'
            : 'text-app-muted hover:bg-app-hover hover:text-app-text'
        "
        @click="activeSection = section.id"
      >
        {{ section.label }}
      </button>
    </nav>

    <p class="mb-4 text-sm text-app-muted">{{ sectionHint }}</p>

    <div v-if="showSkeleton" class="space-y-8">
      <DataSkeleton v-if="activeSection === 'general'" variant="highlights" />
      <DataSkeleton
        variant="table"
        :rows="activeSection === 'goleo' ? 10 : 18"
      />
      <DataSkeleton
        v-if="activeSection === 'fair-play'"
        variant="cards"
        :cards="2"
      />
    </div>

    <template v-else>
      <div v-show="activeSection === 'general'" class="space-y-8">
        <LoMejorDelTorneo :items="highlights" />
        <StandingsTable :rows="standings" title="Tabla General" />
      </div>

      <div v-show="activeSection === 'goleo'">
        <GoleoTable :rows="scorers" />
      </div>

    <div v-show="activeSection === 'menores'">
      <MenoresTable
        :rows="menoresStandings"
        :required-minutes="menoresRequiredMinutes"
        :synced-at="menoresSyncedAt"
      />
    </div>

      <div v-show="activeSection === 'fair-play'">
        <FairPlayPanel />
      </div>
    </template>
  </div>
</template>
