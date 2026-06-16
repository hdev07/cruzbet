import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  applyTheme,
  initTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(initTheme())

  const isDark = computed(() => theme.value === 'dark')

  function setTheme(next: Theme) {
    theme.value = next
    localStorage.setItem(THEME_STORAGE_KEY, next)
    applyTheme(next)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function syncWithSystem() {
    theme.value = resolveTheme()
    applyTheme(theme.value)
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    syncWithSystem,
  }
})
