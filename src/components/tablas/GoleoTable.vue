<script setup lang="ts">
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { ScorerRow } from '@/types/tablas'

defineProps<{
  rows: ScorerRow[]
}>()
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
    <header class="border-b border-app-border px-4 py-3">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        Tabla de Goleo
      </h2>
    </header>
    <div class="overflow-x-auto app-scrollbar">
      <table class="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr class="bg-app-surface-elevated text-left text-xs uppercase tracking-wide text-app-muted">
            <th class="px-3 py-2.5 font-semibold">#</th>
            <th class="px-3 py-2.5 font-semibold">Jugador</th>
            <th class="px-3 py-2.5 font-semibold">Club</th>
            <th class="px-3 py-2.5 text-center font-semibold text-mundial-accent">Goles</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="`${row.position}-${row.teamCode}`"
            class="border-t border-app-border/60 transition hover:bg-app-hover"
          >
            <td class="px-3 py-2.5 tabular-nums text-app-muted">{{ row.position }}</td>
            <td class="px-3 py-2.5 font-medium">{{ row.playerName }}</td>
            <td class="px-3 py-2.5">
              <div class="flex items-center gap-2">
                <TeamFlag
                  :code="row.teamCode"
                  :alt="row.teamName"
                  size="sm"
                />
                <span class="text-app-muted">{{ row.teamName }}</span>
              </div>
            </td>
            <td class="px-3 py-2.5 text-center text-base font-bold tabular-nums text-mundial-accent">
              {{ row.goals }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
