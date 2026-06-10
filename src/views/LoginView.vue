<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Target, ChevronRight } from '@lucide/vue'
import { APP_NAME, APP_TAGLINE } from '@/constants/branding'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()

const error = ref('')
const loading = ref(false)

async function loginWithGoogle() {
  loading.value = true
  error.value = ''
  try {
    await auth.loginWithGoogle()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-mundial-dark px-6 lg:px-8">
    <div class="w-full max-w-sm text-center lg:max-w-md lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/5 lg:p-10 lg:shadow-xl">
      <Target class="mx-auto mb-2 h-14 w-14 text-mundial-accent" :stroke-width="1.5" />
      <h1 class="mb-2 text-3xl font-bold text-mundial-accent">{{ APP_NAME }}</h1>
      <p class="mb-8 text-slate-400">
        {{ APP_TAGLINE }} — predice el primer gol y el ganador antes del partido
      </p>

      <p class="mb-6 text-sm text-slate-500">
        Cuota: <strong class="text-slate-300">${{ ENTRY_FEE_MXN }} MXN</strong> por partido.
        <RouterLink to="/" class="text-mundial-accent hover:underline">Ver quinielas y reglas</RouterLink>
      </p>

      <button
        class="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
        :disabled="loading"
        @click="loginWithGoogle"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {{ loading ? 'Redirigiendo...' : 'Continuar con Google' }}
      </button>

      <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>

      <button
        class="mt-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300"
        @click="router.push('/')"
      >
        Ver partidos sin cuenta
        <ChevronRight class="h-4 w-4" />
      </button>

      <p class="mt-6 text-xs text-slate-500">
        Al continuar, aceptas nuestros
        <RouterLink to="/terminos" class="text-mundial-accent hover:underline">términos</RouterLink>
        y
        <RouterLink to="/privacidad" class="text-mundial-accent hover:underline">privacidad</RouterLink>.
      </p>
    </div>
  </div>
</template>
