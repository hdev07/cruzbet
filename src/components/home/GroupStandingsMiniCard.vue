<script setup lang="ts">
import { computed } from 'vue'
import { MATCHES_PER_GROUP, countFinishedMatchesInGroup } from '@/lib/groupStandings'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { GroupStandings, Match } from '@/types'

const props = defineProps<{
  group: GroupStandings
  matches: Match[]
  selected?: boolean
}>()

const played = computed(() => countFinishedMatchesInGroup(props.group, props.matches))
const progress = computed(() => Math.round((played.value / MATCHES_PER_GROUP) * 100))
const leaders = computed(() => props.group.rows.slice(0, 2))
</script>

<template>
  <button
    type="button"
    class="w-full rounded-xl border p-3 text-left transition"
    :class="
      selected
        ? 'border-mundial-accent bg-mundial-accent/10 ring-1 ring-mundial-accent/40'
        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
    "
  >
    <div class="mb-2 flex items-center justify-between gap-2">
      <span class="text-sm font-bold text-slate-100">Grupo {{ group.groupName }}</span>
      <span class="text-[10px] tabular-nums text-slate-500">{{ played }}/{{ MATCHES_PER_GROUP }}</span>
    </div>

    <div class="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
      <div
        class="h-full rounded-full bg-mundial-accent transition-all duration-500"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <ul class="space-y-1.5">
      <li
        v-for="row in leaders"
        :key="row.team.id"
        class="flex items-center gap-1.5 text-xs"
      >
        <span
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          :class="row.position === 1 ? 'bg-mundial-green text-white' : 'bg-white/15 text-slate-400'"
        >
          {{ row.position }}
        </span>
        <img
          v-if="row.team.flag_url"
          :src="row.team.flag_url"
          :alt="teamDisplayName(row.team)"
          class="h-3.5 w-5 shrink-0 object-cover"
        />
        <span class="min-w-0 flex-1 truncate text-slate-300">{{ teamDisplayName(row.team) }}</span>
        <span class="shrink-0 font-bold tabular-nums text-slate-100">{{ row.points }}</span>
      </li>
    </ul>
  </button>
</template>
