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
      Controla los partidos, registra goles y verifica depósitos de $10 MXN antes de declarar ganadores.
    </p>

    <QuinielaControl />
  </div>
</template>
