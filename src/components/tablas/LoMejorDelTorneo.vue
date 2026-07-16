<script setup lang="ts">
import { Target, Shield, Swords, Scale } from '@lucide/vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import type { TournamentHighlight } from '@/types/tablas'

defineProps<{
  items: TournamentHighlight[]
}>()

const icons = [Target, Swords, Shield, Scale] as const
</script>

<template>
  <section aria-label="Lo Mejor del Torneo">
    <header class="mb-4">
      <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Destacados
      </p>
      <h2 class="mt-1 text-xl font-bold text-app-text">Lo Mejor del Torneo</h2>
    </header>

    <div class="grid gap-3 sm:grid-cols-2">
      <article
        v-for="(item, index) in items"
        :key="item.title + item.subtitle"
        class="rounded-2xl border border-app-border bg-app-surface-elevated p-4"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-mundial-accent">
              {{ item.title === 'Lo Mejor del Torneo' ? item.subtitle : item.title }}
            </p>
            <p v-if="item.title !== 'Lo Mejor del Torneo'" class="mt-0.5 text-xs text-app-muted">
              {{ item.subtitle }}
            </p>
          </div>
          <TeamFlag
            v-if="item.teamCode"
            :code="item.teamCode"
            :alt="item.entityName"
            size="lg"
          />
          <span
            v-else
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mundial-accent/15 text-mundial-accent"
          >
            <component :is="icons[index] ?? Target" class="h-4 w-4" :stroke-width="2" />
          </span>
        </div>

        <p class="text-sm font-medium text-app-text">{{ item.entityName }}</p>

        <div class="mt-3 flex flex-wrap gap-4">
          <div>
            <p class="text-2xl font-bold tabular-nums text-mundial-accent">{{ item.value }}</p>
            <p class="text-xs text-app-muted">{{ item.unit }}</p>
            <p v-if="item.title === 'Lo Mejor del Torneo'" class="mt-0.5 text-xs text-app-muted">
              Ha Anotado
            </p>
          </div>
          <div v-if="item.secondaryLabel != null">
            <p class="text-2xl font-bold tabular-nums text-app-text">
              {{ item.secondaryValue ?? 0 }}
            </p>
            <p class="text-xs text-app-muted">{{ item.secondaryUnit }}</p>
            <p class="mt-0.5 text-xs text-app-muted">{{ item.secondaryLabel }}</p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
