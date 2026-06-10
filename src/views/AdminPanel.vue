<script setup lang="ts">
import { onMounted } from 'vue'
import QuinielaControl from '@/components/admin/QuinielaControl.vue'
import { APP_NAME } from '@/constants/branding'
import { useMatchStore } from '@/stores/matchStore'

const matchStore = useMatchStore()

onMounted(() => matchStore.fetchMatches())
</script>

<template>
  <div>
    <h1 class="mb-2 text-2xl font-bold">{{ APP_NAME }} — Admin</h1>
    <p class="mb-6 text-sm text-slate-400">
      Los 72 partidos ya están en la base. Solo elige cuál está jugando y llena los resultados.
    </p>

    <QuinielaControl />
  </div>
</template>
