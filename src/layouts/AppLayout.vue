<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ThemeToggle from '@/components/shared/ThemeToggle.vue'
import { APP_NAME } from '@/constants/branding'
import { MAIN_NAV, navItemHref, type NavItem } from '@/constants/nav'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const auth = useAuthStore()

function isNavActive(item: NavItem): boolean {
  if (item.to === '/perfil') return route.path === '/perfil'
  if (item.to === '/jornadas') {
    return route.path === '/jornadas' || route.path.startsWith('/jornadas/')
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0"
  >
    <header class="sticky top-0 z-40 border-b border-white/10 bg-mundial-dark/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:max-w-7xl lg:px-8">
        <RouterLink to="/jornadas" class="shrink-0 text-lg font-bold text-mundial-accent lg:text-xl">
          {{ APP_NAME }}
        </RouterLink>

        <nav
          v-if="route.path !== '/login'"
          class="hidden flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1"
        >
          <RouterLink
            v-for="item in MAIN_NAV"
            :key="item.to"
            :to="navItemHref(item, auth.isLoggedIn)"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition lg:gap-2 lg:px-4"
            :class="
              isNavActive(item)
                ? 'bg-mundial-accent/15 text-mundial-accent'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            "
          >
            <component :is="item.icon" class="h-4 w-4" :stroke-width="2" />
            {{ item.label }}
          </RouterLink>
        </nav>

        <div v-if="auth.isLoggedIn" class="flex shrink-0 items-center gap-2 lg:gap-3">
          <ThemeToggle size="sm" />
          <RouterLink
            to="/perfil"
            class="flex items-center gap-2 text-sm text-slate-300"
            title="Mi perfil"
          >
            <img
              v-if="auth.profile?.avatar"
              :src="auth.profile.avatar"
              :alt="auth.profile.username ?? 'Usuario'"
              class="h-8 w-8 rounded-full border border-white/20 lg:h-9 lg:w-9"
            />
            <span
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs lg:h-9 lg:w-9"
            >
              {{ auth.profile?.username?.[0]?.toUpperCase() ?? '?' }}
            </span>
            <span class="hidden text-sm font-medium lg:inline">
              {{ auth.profile?.username ?? 'Perfil' }}
            </span>
          </RouterLink>
        </div>

        <div v-else-if="route.path !== '/login'" class="flex shrink-0 items-center gap-2">
          <ThemeToggle size="sm" />
          <RouterLink
            to="/login"
            class="rounded-lg bg-mundial-accent px-3 py-1.5 text-sm font-semibold lg:px-4 lg:py-2"
          >
            Entrar
          </RouterLink>
        </div>
      </div>
    </header>

    <main
      class="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl lg:px-8 lg:py-8"
    >
      <slot />
    </main>

    <nav
      v-if="route.path !== '/login'"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-mundial-dark/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden"
    >
      <div class="mx-auto flex w-full max-w-xl">
        <RouterLink
          v-for="item in MAIN_NAV"
          :key="item.to"
          :to="navItemHref(item, auth.isLoggedIn)"
          class="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 text-xs font-medium transition active:opacity-70"
          :class="isNavActive(item) ? 'text-mundial-accent' : 'text-slate-400'"
        >
          <component :is="item.icon" class="h-6 w-6 shrink-0" :stroke-width="2" />
          <span class="max-w-full truncate leading-none">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
