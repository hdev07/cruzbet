<script setup lang="ts">
import HomeTournamentHub from '@/components/home/HomeTournamentHub.vue'
</script>

<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Torneo
      </p>
      <h1 class="text-2xl font-bold text-slate-100 lg:text-3xl">Mundial 2026</h1>
      <p class="mt-1 text-sm text-slate-400 lg:text-base">
        Partidos en vivo, tablas de grupos y calendario del torneo
      </p>
    </header>

    <HomeTournamentHub />
  </div>
</template>
