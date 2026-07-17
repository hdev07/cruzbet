<script setup lang="ts">
import { RouterLink } from 'vue-router'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { StandingRow } from '@/types/tablas'

defineProps<{
  rows: StandingRow[]
  title?: string
}>()
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
    <header v-if="title" class="border-b border-app-border px-4 py-3">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        {{ title }}
      </h2>
    </header>
    <div class="overflow-x-auto app-scrollbar">
      <table class="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr class="bg-app-surface-elevated text-left text-xs uppercase tracking-wide text-app-muted">
            <th class="px-3 py-2.5 font-semibold">#</th>
            <th class="px-3 py-2.5 font-semibold">Club</th>
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
            v-for="row in rows"
            :key="row.teamCode"
            class="border-t border-app-border/60 transition hover:bg-app-hover"
          >
            <td class="px-3 py-2.5 tabular-nums text-app-muted">{{ row.position }}</td>
            <td class="px-3 py-2.5">
              <RouterLink
                :to="`/tablas/equipo/${row.teamCode}`"
                class="flex items-center gap-2.5 hover:text-mundial-accent"
              >
                <TeamFlag
                  :code="row.teamCode"
                  :alt="row.teamName"
                  size="sm"
                />
                <span class="font-medium text-app-text">{{ row.teamName }}</span>
              </RouterLink>
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
</template>
