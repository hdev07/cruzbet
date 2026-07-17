<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import MatchRowCard from '@/components/home/MatchRowCard.vue'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { friendlyLoadError } from '@/lib/offlineCache'
import { fetchTeamHistory, type TeamHistory } from '@/lib/teamHistory'

const route = useRoute()

const teamCode = computed(() => (route.params.code as string).toUpperCase())
const loading = ref(false)
const loadError = ref<string | null>(null)
const history = ref<TeamHistory | null>(null)

async function load() {
  loading.value = true
  loadError.value = null
  history.value = null
  try {
    history.value = await fetchTeamHistory(teamCode.value)
  } catch (err) {
    loadError.value = friendlyLoadError(err, 'No se pudo cargar el historial del equipo')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(teamCode, load)
</script>

<template>
  <div>
    <RouterLink
      to="/tablas"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-mundial-green"
    >
      <ArrowLeft class="h-4 w-4" />
      Tablas
    </RouterLink>

    <div v-if="loading" class="space-y-6">
      <div class="flex items-center gap-3">
        <div class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-white/10" />
        <div class="h-6 w-40 animate-pulse rounded bg-white/10" />
      </div>
      <DataSkeleton variant="table" :rows="3" />
      <DataSkeleton variant="list" :rows="4" />
    </div>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <p v-else-if="!history" class="rounded-lg bg-white/5 px-3 py-2 text-sm text-app-muted">
      No encontramos un equipo con el código "{{ teamCode }}".
    </p>

    <template v-else>
      <header class="mb-6 flex items-center gap-3">
        <TeamFlag
          :src="history.team.crestUrl"
          :code="history.team.code"
          :alt="history.team.name"
          size="lg"
          img-class="h-14 w-14"
        />
        <div>
          <h1 class="text-2xl font-bold lg:text-3xl">{{ history.team.name }}</h1>
          <p class="mt-0.5 text-sm text-app-muted">
            {{ history.matches.length }}
            {{ history.matches.length === 1 ? 'partido registrado' : 'partidos registrados' }}
          </p>
        </div>
      </header>

      <section
        v-if="history.byCompetition.length"
        class="mb-8 overflow-hidden rounded-2xl border border-app-border bg-app-surface"
      >
        <header class="border-b border-app-border px-4 py-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
            Por torneo
          </h2>
        </header>
        <div class="overflow-x-auto app-scrollbar">
          <table class="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr class="bg-app-surface-elevated text-left text-xs uppercase tracking-wide text-app-muted">
                <th class="px-3 py-2.5 font-semibold">Torneo</th>
                <th class="px-2 py-2.5 text-center font-semibold">JJ</th>
                <th class="px-2 py-2.5 text-center font-semibold">G</th>
                <th class="px-2 py-2.5 text-center font-semibold">E</th>
                <th class="px-2 py-2.5 text-center font-semibold">P</th>
                <th class="px-2 py-2.5 text-center font-semibold">GF</th>
                <th class="px-2 py-2.5 text-center font-semibold">GC</th>
                <th class="px-2 py-2.5 text-center font-semibold">DG</th>
                <th class="px-3 py-2.5 text-center font-semibold text-mundial-accent">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in history.byCompetition"
                :key="row.competitionId"
                class="border-t border-app-border/60"
              >
                <td class="px-3 py-2.5">
                  <span class="font-medium text-app-text">{{ row.competitionName }}</span>
                  <span class="ml-1 text-xs text-app-muted">{{ row.competitionSeason }}</span>
                </td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.played }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.won }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.drawn }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.lost }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.goalsFor }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.goalsAgainst }}</td>
                <td class="px-2 py-2.5 text-center tabular-nums">{{ row.goalDiff }}</td>
                <td class="px-3 py-2.5 text-center text-base font-bold tabular-nums text-mundial-accent">
                  {{ row.points }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-mundial-accent">
          Historial de partidos
        </h2>
        <div v-if="history.matches.length" class="space-y-2">
          <MatchRowCard v-for="match in history.matches" :key="match.id" :match="match" />
        </div>
        <p v-else class="rounded-lg bg-white/5 px-3 py-2 text-sm text-app-muted">
          Todavía no hay partidos registrados para este equipo.
        </p>
      </section>
    </template>
  </div>
</template>
