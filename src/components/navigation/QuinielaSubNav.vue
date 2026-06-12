<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { QUINIELA_SUB_NAV, navItemHref, type NavItem } from '@/constants/nav'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const auth = useAuthStore()

function isSubNavActive(item: NavItem): boolean {
  if (item.to === '/jornadas') {
    const sub = route.path.slice('/jornadas/'.length)
    const isRoundDetail =
      route.path.startsWith('/jornadas/') && sub.length > 0 && !['todas'].includes(sub)
    return route.path === '/jornadas' || route.path === '/jornadas/todas' || isRoundDetail
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>

<template>
  <nav
    class="border-b border-white/10 bg-mundial-dark/80"
    aria-label="Sección quiniela"
  >
    <div class="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 md:justify-center md:px-6 lg:max-w-7xl lg:px-8">
      <RouterLink
        v-for="item in QUINIELA_SUB_NAV"
        :key="item.to"
        :to="navItemHref(item, auth.isLoggedIn)"
        class="flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition"
        :class="
          isSubNavActive(item)
            ? 'border-mundial-green text-mundial-green'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        "
      >
        <component :is="item.icon" class="h-4 w-4" :stroke-width="2" />
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>
