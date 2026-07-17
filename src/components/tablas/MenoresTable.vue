<script setup lang="ts">
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { MenoresStandingRow } from '@/types/tablas'

defineProps<{
  rows: MenoresStandingRow[]
  requiredMinutes?: number | null
  syncedAt?: string | null
  title?: string
}>()

function formatSyncedAt(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
    <header class="border-b border-app-border px-4 py-3">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-mundial-accent">
        {{ title ?? 'Regla de menores' }}
      </h2>
      <p class="mt-1 text-xs text-app-muted">
        Minutos oficiales Liga MX
        <template v-if="requiredMinutes"> · meta {{ requiredMinutes.toLocaleString('es-MX') }}</template>
        <template v-if="syncedAt"> · act. {{ formatSyncedAt(syncedAt) }}</template>
      </p>
    </header>

    <div
      v-if="!rows.length"
      class="px-4 py-8 text-center text-sm text-app-muted"
    >
      Aún no hay datos de menores. Se actualizan desde ligamx.net con el sync automático.
    </div>

    <div v-else class="overflow-x-auto app-scrollbar">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="bg-app-surface-elevated text-left text-xs uppercase tracking-wide text-app-muted">
            <th class="px-3 py-2.5 font-semibold">#</th>
            <th class="px-3 py-2.5 font-semibold">Club</th>
            <th class="px-2 py-2.5 text-center font-semibold">Jug.</th>
            <th class="px-2 py-2.5 text-center font-semibold">Acum.</th>
            <th class="px-2 py-2.5 text-center font-semibold text-mundial-accent">Al regl.</th>
            <th class="px-2 py-2.5 text-center font-semibold">Por cumplir</th>
            <th class="px-3 py-2.5 text-center font-semibold">Estado</th>
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
              <div class="flex items-center gap-2.5">
                <TeamFlag :code="row.teamCode" :alt="row.teamName" size="sm" />
                <span class="font-medium text-app-text">{{ row.teamName }}</span>
              </div>
            </td>
            <td class="px-2 py-2.5 text-center tabular-nums">{{ row.playersAccumulated }}</td>
            <td class="px-2 py-2.5 text-center tabular-nums">{{ row.minutesAccumulated }}</td>
            <td class="px-2 py-2.5 text-center text-base font-bold tabular-nums text-mundial-accent">
              {{ row.minutesToRegulation }}
            </td>
            <td class="px-2 py-2.5 text-center tabular-nums">
              {{ row.fulfilled ? '—' : row.minutesRemaining }}
            </td>
            <td class="px-3 py-2.5 text-center">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="
                  row.fulfilled
                    ? 'bg-mundial-green/15 text-mundial-green'
                    : 'bg-amber-500/15 text-amber-300'
                "
              >
                {{ row.fulfilled ? 'Cumplió' : 'Pendiente' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
