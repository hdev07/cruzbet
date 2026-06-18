<script setup lang="ts">
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { GroupStandingRow } from '@/types'

defineProps<{
  rows: GroupStandingRow[]
  groupName: string
  compact?: boolean
}>()

function rowZone(position: number): 'qualified' | 'third' | 'out' | null {
  if (position <= 2) return 'qualified'
  if (position === 3) return 'third'
  if (position === 4) return 'out'
  return null
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
    <table class="w-full min-w-[32rem] text-sm">
      <thead>
        <tr class="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
          <th class="px-2 py-2.5 text-left font-semibold sm:px-3">#</th>
          <th class="px-2 py-2.5 text-left font-semibold sm:px-3">Equipo</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Partidos jugados">PJ</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Ganados">G</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Empates">E</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Perdidos">P</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Goles a favor">GF</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Goles en contra">GC</th>
          <th class="px-1.5 py-2.5 text-center font-semibold" title="Diferencia de goles">DG</th>
          <th class="px-2 py-2.5 text-center font-semibold sm:px-3" title="Puntos">PTS</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.team.id"
          class="border-b border-white/5 last:border-0"
          :class="{
            'bg-mundial-green/10': rowZone(row.position) === 'qualified',
            'bg-amber-500/10': rowZone(row.position) === 'third',
            'opacity-70': rowZone(row.position) === 'out',
          }"
        >
          <td class="px-2 py-2.5 tabular-nums sm:px-3">
            <span
              class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
              :class="
                row.position <= 2
                  ? 'bg-mundial-green text-white'
                  : row.position === 3
                    ? 'bg-amber-500/30 text-amber-200'
                    : 'bg-white/10 text-slate-400'
              "
            >
              {{ row.position }}
            </span>
          </td>
          <td class="px-2 py-2.5 sm:px-3">
            <div class="flex min-w-0 items-center gap-2">
              <TeamFlag
                v-if="row.team.flag_url"
                :src="row.team.flag_url"
                :alt="teamDisplayName(row.team)"
                img-class="h-5 w-7 shrink-0 object-cover"
              />
              <span class="truncate font-medium" :class="{ 'max-w-[5rem] sm:max-w-none': compact }">
                {{ teamDisplayName(row.team) }}
              </span>
            </div>
          </td>
          <td class="px-1.5 py-2.5 text-center tabular-nums text-slate-300">{{ row.played }}</td>
          <td class="px-1.5 py-2.5 text-center tabular-nums text-slate-300">{{ row.won }}</td>
          <td class="px-1.5 py-2.5 text-center tabular-nums text-slate-300">{{ row.drawn }}</td>
          <td class="px-1.5 py-2.5 text-center tabular-nums text-slate-300">{{ row.lost }}</td>
          <td class="px-1.5 py-2.5 text-center tabular-nums text-slate-300">{{ row.goalsFor }}</td>
          <td class="px-1.5 py-2.5 text-center tabular-nums text-slate-300">{{ row.goalsAgainst }}</td>
          <td
            class="px-1.5 py-2.5 text-center tabular-nums font-medium"
            :class="row.goalDiff > 0 ? 'text-mundial-green' : row.goalDiff < 0 ? 'text-mundial-accent' : 'text-slate-400'"
          >
            {{ row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff }}
          </td>
          <td class="px-2 py-2.5 text-center text-base font-bold tabular-nums text-white sm:px-3">
            {{ row.points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
