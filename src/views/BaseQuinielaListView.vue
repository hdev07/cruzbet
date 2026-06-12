<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const router = useRouter()
const baseStore = useBaseQuinielaStore()

onMounted(async () => {
  await baseStore.fetchRounds()
  if (baseStore.activeRound) {
    await router.replace(`/jornadas/${baseStore.activeRound.id}`)
  }
})
</script>

<template>
  <p class="text-center text-slate-400">Cargando jornada...</p>
</template>
