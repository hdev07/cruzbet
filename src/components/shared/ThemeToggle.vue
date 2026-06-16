<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { useThemeStore } from '@/stores/themeStore'

withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const theme = useThemeStore()

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-[1.125rem] w-[1.125rem]',
}
</script>

<template>
  <button
    type="button"
    class="inline-flex shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-surface-elevated text-app-muted transition hover:bg-app-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mundial-accent/40"
    :class="sizeClasses[size]"
    :aria-label="theme.isDark ? 'Activar modo día' : 'Activar modo noche'"
    :title="theme.isDark ? 'Modo día' : 'Modo noche'"
    @click="theme.toggleTheme()"
  >
    <Sun v-if="theme.isDark" :class="iconSizes[size]" :stroke-width="2" />
    <Moon v-else :class="iconSizes[size]" :stroke-width="2" />
  </button>
</template>
