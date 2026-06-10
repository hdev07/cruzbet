<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ClipboardList, Home, Trophy, User } from '@lucide/vue'
import InstallPrompt from '@/components/shared/InstallPrompt.vue'
import { APP_NAME } from '@/constants/branding'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const auth = useAuthStore()

const navItems: { to: string; label: string; icon: Component }[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/reglas', label: 'Reglas', icon: ClipboardList },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/perfil', label: 'Perfil', icon: User },
]
</script>

<template>
  <div class="flex min-h-screen flex-col pb-20">
    <header class="sticky top-0 z-40 border-b border-white/10 bg-mundial-dark/95 backdrop-blur">
      <div class="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <RouterLink to="/" class="text-lg font-bold text-mundial-accent">
          {{ APP_NAME }}
        </RouterLink>

        <div v-if="auth.isLoggedIn" class="flex items-center gap-2">
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-slate-300"
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
              class="h-8 w-8 rounded-full border border-white/20"
            />
            <span v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs">
              {{ auth.profile?.username?.[0]?.toUpperCase() ?? '?' }}
            </span>
          </RouterLink>
        </div>

        <div v-else-if="route.path !== '/login'" class="flex items-center gap-2">
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="rounded-lg bg-white/10 px-2 py-1.5 text-xs font-semibold"
          >
            Admin
          </RouterLink>
          <RouterLink
            to="/login"
            class="rounded-lg bg-mundial-accent px-3 py-1.5 text-sm font-semibold"
          >
            Entrar
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-lg flex-1 px-4 py-6">
      <slot />
    </main>

    <nav
      v-if="route.path !== '/login'"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-mundial-dark/95 backdrop-blur"
    >
      <div class="mx-auto flex max-w-lg">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition"
          :class="route.path === item.to ? 'text-mundial-accent' : 'text-slate-400'"
        >
          <component :is="item.icon" class="h-5 w-5" :stroke-width="2" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <InstallPrompt />
  </div>
</template>
