<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import HomeNextMatchSection from '@/components/home/HomeNextMatchSection.vue'
import WeekendCalendar from '@/components/home/WeekendCalendar.vue'
import { useMatchLifecycleClock } from '@/composables/useMatchLifecycleClock'
import { APP_TAGLINE } from '@/constants/branding'
import { buildWeekendCalendar } from '@/lib/weekendCalendar'
import { useAuthStore } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'

const auth = useAuthStore()
const matchStore = useMatchStore()
const { loading, matches } = storeToRefs(matchStore)
const lifecycleNow = useMatchLifecycleClock()

const greeting = computed(() => {
  if (auth.isLoggedIn && auth.profile?.username) {
    return `Hola, ${auth.profile.username}`
  }
  return 'En vivo y calendario'
})

const weekendDays = computed(() =>
  buildWeekendCalendar(matches.value, lifecycleNow.value),
)

onMounted(() => {
  void matchStore.fetchMatches()
})
</script>

<template>
  <div class="w-full">
    <header class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-widest text-mundial-accent">
        Liga MX · Apertura 2026
      </p>
      <h1 class="mt-1 text-2xl font-bold lg:text-3xl">{{ greeting }}</h1>
      <p class="mt-2 max-w-lg text-sm text-app-muted lg:text-base">
        {{ APP_TAGLINE }} — partido en vivo, próximo encuentro y el fin de semana por día.
      </p>
    </header>

    <HomeNextMatchSection class="mb-8" />

    <WeekendCalendar :days="weekendDays" :loading="loading && !matches.length" />
  </div>
</template>
