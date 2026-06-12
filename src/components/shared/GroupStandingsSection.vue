<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import GroupStandingsTable from '@/components/shared/GroupStandingsTable.vue'
import { supabase } from '@/lib/supabase'
import { GRUPOS_PATH } from '@/constants/nav'
import { useGroupStandingsStore } from '@/stores/groupStandingsStore'
import { useMatchStore } from '@/stores/matchStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    showLegend?: boolean
    showViewAllLink?: boolean
    compact?: boolean
  }>(),
  {
    showHeader: true,
    showLegend: true,
    showViewAllLink: false,
    compact: false,
  },
)

const standingsStore = useGroupStandingsStore()
const matchStore = useMatchStore()
let channel: RealtimeChannel | null = null

onMounted(async () => {
  await standingsStore.fetchStandingsData()

  channel = supabase
    .channel('group-standings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
      await matchStore.fetchMatches()
      standingsStore.refreshFromMatches(matchStore.matches)
    })
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})

watch(
  () => matchStore.matches,
  (matches) => {
    if (matches.length) standingsStore.refreshFromMatches(matches)
  },
)
</script>

<template>
  <section>
    <div v-if="showHeader" class="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Tabla de grupos
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Clasificación de la fase de grupos del Mundial 2026
        </p>
      </div>
      <RouterLink
        v-if="showViewAllLink"
        :to="GRUPOS_PATH"
        class="inline-flex items-center gap-1 text-xs text-mundial-accent hover:underline"
      >
        Ver todos los grupos
        <ChevronRight class="h-3.5 w-3.5" />
      </RouterLink>
    </div>

    <p v-if="standingsStore.loading" class="text-sm text-slate-400">Cargando tablas...</p>

    <div v-else class="space-y-4">
      <div class="flex gap-1.5 overflow-x-auto pb-1 app-scrollbar">
        <button
          v-for="group in standingsStore.groupLetters"
          :key="group"
          type="button"
          class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition"
          :class="
            standingsStore.selectedGroup === group
              ? 'bg-mundial-accent text-white'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          "
          @click="standingsStore.setSelectedGroup(group)"
        >
          Grupo {{ group }}
        </button>
      </div>

      <GroupStandingsTable
        v-if="standingsStore.currentStandings"
        :rows="standingsStore.currentStandings.rows"
        :group-name="standingsStore.currentStandings.groupName"
        :compact="compact"
      />

      <div
        v-else
        class="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-slate-400"
      >
        Aún no hay datos de grupos disponibles.
      </div>

      <div
        v-if="showLegend"
        class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"
      >
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-mundial-green" />
          Puestos 1-2: clasifican directo
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Puesto 3: candidato a mejor tercero
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-white/20" />
          Puesto 4: eliminado
        </span>
      </div>
    </div>
  </section>
</template>
