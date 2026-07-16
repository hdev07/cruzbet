<script setup lang="ts">
import MatchRowCard from '@/components/home/MatchRowCard.vue'
import type { CalendarDay } from '@/lib/weekendCalendar'

defineProps<{
  days: CalendarDay[]
  loading?: boolean
}>()
</script>

<template>
  <section class="rounded-2xl border border-white/10 bg-white/[0.03]" aria-label="Calendario del fin de semana">
    <div class="border-b border-white/10 px-4 py-4 sm:px-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">
        Calendario
      </p>
      <h2 class="mt-1 text-lg font-bold">Fin de semana</h2>
      <p class="mt-1 text-sm text-app-muted">
        Partidos pasados y siguientes, agrupados por día
      </p>
    </div>

    <div v-if="loading" class="space-y-4 p-4 sm:p-5">
      <div class="h-6 w-40 animate-pulse rounded-lg bg-white/10" />
      <div class="h-16 animate-pulse rounded-xl bg-white/5" />
      <div class="h-16 animate-pulse rounded-xl bg-white/5" />
    </div>

    <div v-else-if="!days.length" class="p-8 text-center text-sm text-app-muted">
      No hay partidos en esta ventana de jornada.
    </div>

    <div v-else class="divide-y divide-white/10">
      <div
        v-for="day in days"
        :key="day.dateKey"
        class="px-4 py-4 sm:px-5"
        :class="day.isToday ? 'bg-mundial-accent/[0.06]' : ''"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold">
              {{ day.label }}
            </p>
            <p v-if="day.isToday" class="text-xs font-medium text-mundial-accent">
              Hoy
            </p>
            <p v-else-if="day.isPast" class="text-xs text-app-muted">
              Resultados
            </p>
            <p v-else class="text-xs text-app-muted">
              Próximos
            </p>
          </div>
          <span
            class="rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            :class="
              day.isToday
                ? 'bg-mundial-accent/20 text-mundial-accent'
                : 'bg-white/5 text-app-muted'
            "
          >
            {{ day.matches.length }}
            {{ day.matches.length === 1 ? 'partido' : 'partidos' }}
          </span>
        </div>

        <div class="space-y-2">
          <MatchRowCard
            v-for="match in day.matches"
            :key="match.id"
            :match="match"
          />
        </div>
      </div>
    </div>
  </section>
</template>
