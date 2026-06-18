<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, GitBranch, Lock } from '@lucide/vue'
import KnockoutBracketTree from '@/components/bracket/KnockoutBracketTree.vue'
import { GRUPOS_PATH, MUNDIAL_PATH } from '@/constants/nav'
import {
  buildKnockoutRounds,
  groupStageProgress,
  isGroupStageComplete,
  isKnockoutFilled,
} from '@/lib/knockoutBracket'
import { useGroupStandingsStore } from '@/stores/groupStandingsStore'
import { useMatchStore } from '@/stores/matchStore'

const matchStore = useMatchStore()
const standingsStore = useGroupStandingsStore()

onMounted(async () => {
  if (!matchStore.matches.length) await matchStore.fetchMatches()
  if (!standingsStore.teams.length) await standingsStore.fetchStandingsData()
})

const progress = computed(() =>
  groupStageProgress(standingsStore.teams, matchStore.matches),
)

const groupsComplete = computed(() =>
  isGroupStageComplete(standingsStore.teams, matchStore.matches),
)

const bracketFilled = computed(() => isKnockoutFilled(matchStore.matches))

const rounds = computed(() => buildKnockoutRounds(matchStore.matches))

const knockoutCount = computed(
  () => matchStore.matches.filter((m) => m.phase && m.phase !== 'group').length,
)
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

    <div class="mb-2 flex items-center gap-2">
      <GitBranch class="h-7 w-7 text-mundial-accent" />
      <h1 class="text-2xl font-bold lg:text-3xl">Eliminatoria</h1>
    </div>
    <p class="mb-6 text-sm text-slate-400">
      Árbol de llaves — dieciseisavos, octavos, cuartos, semifinales y final
    </p>

    <div class="mb-6 grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-slate-400">Fase de grupos</p>
        <p class="text-2xl font-bold tabular-nums">
          {{ progress.finished }}/{{ progress.total }}
        </p>
        <p class="mt-1 text-xs text-slate-500">partidos finalizados</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-slate-400">Partidos eliminatoria</p>
        <p class="text-2xl font-bold tabular-nums">{{ knockoutCount || 32 }}</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs text-slate-400">Estado del cuadro</p>
        <p
          class="text-lg font-bold"
          :class="bracketFilled ? 'text-mundial-green' : groupsComplete ? 'text-mundial-accent' : 'text-slate-300'"
        >
          {{
            bracketFilled
              ? 'Equipos asignados'
              : groupsComplete
                ? 'Generando llaves…'
                : 'Pendiente grupos'
          }}
        </p>
      </div>
    </div>

    <div
      v-if="!groupsComplete"
      class="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100/90"
    >
      <Lock class="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p class="font-medium">El cuadro se llena automáticamente</p>
        <p class="mt-1 text-amber-100/70">
          Cuando los 72 partidos de fase de grupos estén finalizados, los 32 clasificados
          (24 directos + 8 mejores terceros) se asignarán a los dieciseisavos.
          Avance de ganadores en cada ronda también es automático.
        </p>
        <RouterLink
          :to="GRUPOS_PATH"
          class="mt-2 inline-block text-mundial-accent hover:underline"
        >
          Ver tablas de grupos →
        </RouterLink>
      </div>
    </div>

    <div v-if="!rounds.some((r) => r.matches.length)" class="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
      <p class="text-slate-400">
        Aún no hay partidos de eliminatoria cargados.
      </p>
      <p class="mt-2 text-xs text-slate-500">
        Ejecuta <code class="rounded bg-white/10 px-1">knockout_bracket_migration.sql</code>
        y <code class="rounded bg-white/10 px-1">seed_knockout.sql</code> en Supabase.
      </p>
    </div>

    <KnockoutBracketTree v-else :rounds="rounds" />
  </div>
</template>
