<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Target } from '@lucide/vue'
import { APP_NAME, APP_TAGLINE } from '@/constants/branding'
import ThemeToggle from '@/components/shared/ThemeToggle.vue'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const pin = ref('')
const error = ref('')
const loading = ref(false)

const pinValid = () => /^\d{4,8}$/.test(pin.value.trim())

async function loginWithUsername() {
  loading.value = true
  error.value = ''
  try {
    await auth.loginWithUsername(username.value, pin.value)
    await router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}

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
  <div class="relative flex min-h-screen flex-col items-center justify-center bg-app-bg px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] lg:px-8">
    <div class="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] lg:right-8 lg:top-8">
      <ThemeToggle size="sm" />
    </div>
    <div class="w-full max-w-sm text-center lg:max-w-md lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/5 lg:p-10 lg:shadow-xl">
      <Target class="mx-auto mb-2 h-14 w-14 text-mundial-accent" :stroke-width="1.5" />
      <h1 class="mb-2 text-3xl font-bold text-mundial-accent">{{ APP_NAME }}</h1>
      <p class="mb-8 text-slate-400">
        {{ APP_TAGLINE }} — marca L, E o V en cada jornada de Liga MX
      </p>

      <form class="text-left" @submit.prevent="loginWithUsername">
        <label for="login-username" class="mb-2 block text-sm font-medium text-slate-300">
          Tu nombre de jugador
        </label>
        <input
          id="login-username"
          v-model="username"
          type="text"
          autocomplete="username"
          maxlength="30"
          placeholder="Ej. Cruz, Pedrito..."
          class="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-mundial-accent/50 focus:outline-none focus:ring-2 focus:ring-mundial-accent/30"
          :disabled="loading"
        />

        <label for="login-pin" class="mb-2 block text-sm font-medium text-slate-300">
          Tu PIN
        </label>
        <input
          id="login-pin"
          v-model="pin"
          type="password"
          inputmode="numeric"
          autocomplete="current-password"
          maxlength="8"
          pattern="[0-9]*"
          placeholder="4 a 8 dígitos"
          class="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-mundial-accent/50 focus:outline-none focus:ring-2 focus:ring-mundial-accent/30"
          :disabled="loading"
        />

        <button
          type="submit"
          class="w-full rounded-xl bg-mundial-accent px-4 py-3 font-semibold text-mundial-dark transition hover:brightness-110 disabled:opacity-50"
          :disabled="loading || !username.trim() || !pinValid()"
        >
          {{ loading ? 'Entrando...' : 'Entrar con tu nombre' }}
        </button>
      </form>

      <p class="my-4 text-xs text-slate-500">
        Elige un PIN de 4 a 8 dígitos. Lo usarás para volver a entrar si cierras sesión o cambias de dispositivo.
      </p>

<!-- Google discreto: solo para cuentas creadas antes con Google -->
      <button
        type="button"
        class="mt-2 text-xs text-slate-500 underline-offset-2 transition hover:text-slate-300 hover:underline disabled:opacity-50"
        :disabled="loading"
        @click="loginWithGoogle"
      >
        ¿Entraste antes con Google? Continuar con Google
      </button>

      <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>

      <RouterLink to="/" class="mt-6 inline-block text-sm text-slate-500 hover:text-slate-300">
        Volver a la quiniela
      </RouterLink>
    </div>
  </div>
</template>
