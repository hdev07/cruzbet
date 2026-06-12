<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import InstallPrompt from '@/components/shared/InstallPrompt.vue'
import { APP_NAME } from '@/constants/branding'
import { HUB_NAV, isQuinielaRoute, QUINIELA_NAV, type NavItem } from '@/constants/nav'
import { useLiveSync } from '@/composables/useLiveSync'
import { useAuthStore } from '@/stores/authStore'

useLiveSync()

const route = useRoute()
const auth = useAuthStore()

const navItems = computed((): NavItem[] =>
  isQuinielaRoute(route.path) ? QUINIELA_NAV : HUB_NAV,
)

function isNavActive(item: NavItem): boolean {
  if (item.to === '/') return route.path === '/'
  if (item.to === '/perfil') return route.path === '/perfil'
  if (item.to === '/jornadas') {
    const sub = route.path.slice('/jornadas/'.length)
    const isRoundDetail =
      route.path.startsWith('/jornadas/') &&
      sub.length > 0 &&
      !['todas'].includes(sub)
    return route.path === '/jornadas' || route.path === '/jornadas/todas' || isRoundDetail
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col"
    :class="route.meta.hideBottomNav ? 'pb-0' : 'pb-[4.5rem] md:pb-0'"
  >
    <header class="sticky top-0 z-40 border-b border-white/10 bg-mundial-dark/95 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:max-w-7xl lg:px-8">
        <RouterLink to="/" class="shrink-0 text-lg font-bold text-mundial-accent lg:text-xl">
          {{ APP_NAME }}
        </RouterLink>

        <nav
          v-if="route.path !== '/login'"
          class="hidden flex-1 items-center justify-center gap-1 md:flex"
        >
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
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
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-slate-300 lg:px-3 lg:py-1.5 lg:text-sm"
          >
            Admin
          </RouterLink>
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
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="rounded-lg bg-white/10 px-2 py-1.5 text-xs font-semibold lg:px-3 lg:text-sm"
          >
            Admin
          </RouterLink>
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
      class="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:max-w-2xl md:max-w-3xl lg:max-w-5xl lg:px-8 lg:py-8 xl:max-w-6xl"
    >
      <slot />
    </main>

    <nav
      v-if="route.path !== '/login' && !route.meta.hideBottomNav"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-mundial-dark/95 backdrop-blur md:hidden"
    >
      <div class="mx-auto flex w-full max-w-xl">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition"
          :class="isNavActive(item) ? 'text-mundial-accent' : 'text-slate-400'"
        >
          <component :is="item.icon" class="h-5 w-5" :stroke-width="2" />
          <span class="truncate px-0.5">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <InstallPrompt />
  </div>
</template>
