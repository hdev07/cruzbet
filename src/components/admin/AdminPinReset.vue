<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound, Loader2 } from '@lucide/vue'
import { supabase } from '@/lib/supabase'
import { validatePinFormat, validateUsernameFormat } from '@/lib/usernameAuth'

const username = ref('')
const newPin = ref('')
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

async function resetPin() {
  error.value = null
  success.value = null

  const usernameError = validateUsernameFormat(username.value)
  if (usernameError) {
    error.value = usernameError
    return
  }
  const pinError = validatePinFormat(newPin.value)
  if (pinError) {
    error.value = pinError
    return
  }

  saving.value = true
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) throw new Error('Sesión expirada; vuelve a entrar')

    const response = await fetch('/api/admin-reset-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: username.value.trim(), newPin: newPin.value.trim() }),
    })

    const payload = (await response.json()) as {
      ok: boolean
      username?: string
      message?: string
      error?: string
    }

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message ?? payload.error ?? 'No se pudo restablecer el PIN')
    }

    success.value = `PIN de ${payload.username ?? username.value.trim()} restablecido. Compárteselo al jugador.`
    username.value = ''
    newPin.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo restablecer el PIN'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="theme-card rounded-xl border border-white/10 p-4">
    <div class="mb-3 flex items-center gap-2">
      <KeyRound class="h-4 w-4 text-mundial-accent" />
      <h2 class="text-sm font-semibold text-app-text">Restablecer PIN de un jugador</h2>
    </div>
    <p class="mb-3 text-xs text-slate-500">
      Para jugadores que olvidaron su PIN (solo cuentas usuario+PIN, no Google).
      Escribe el nuevo PIN y compárteselo; podrán entrar de inmediato con él.
    </p>

    <form
      class="flex flex-col gap-2 sm:flex-row sm:items-end"
      @submit.prevent="resetPin"
    >
      <label class="min-w-0 flex-1 text-xs text-slate-400">
        Nombre de jugador
        <input
          v-model="username"
          type="text"
          maxlength="30"
          autocomplete="off"
          placeholder="Ej. Pedrito"
          class="theme-field mt-1 w-full rounded-lg px-3 py-2 text-sm"
          :disabled="saving"
        />
      </label>

      <label class="text-xs text-slate-400 sm:w-36">
        Nuevo PIN
        <input
          v-model="newPin"
          type="text"
          inputmode="numeric"
          maxlength="8"
          autocomplete="off"
          placeholder="4-8 dígitos"
          class="theme-field mt-1 w-full rounded-lg px-3 py-2 text-sm"
          :disabled="saving"
        />
      </label>

      <button
        type="submit"
        class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-mundial-accent px-4 py-2 text-sm font-semibold text-mundial-dark transition hover:brightness-110 disabled:opacity-50"
        :disabled="saving || !username.trim() || !newPin.trim()"
      >
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
        {{ saving ? 'Guardando...' : 'Restablecer' }}
      </button>
    </form>

    <p v-if="error" class="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
      {{ error }}
    </p>
    <p
      v-if="success"
      class="mt-2 rounded-lg bg-mundial-green/10 px-3 py-2 text-xs text-mundial-green"
    >
      {{ success }}
    </p>
  </section>
</template>
