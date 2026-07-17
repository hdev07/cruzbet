import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { cleanupOAuthUrl, hasOAuthCallbackInUrl } from '@/lib/authCallback'
import { getAuthRedirectUrl } from '@/lib/authRedirect'
import { ADMIN_EMAIL } from '@/lib/matchRules'
import { supabase } from '@/lib/supabase'
import {
  clearStoredAuthPassword,
  deriveAuthPassword,
  getStoredAuthPassword,
  usernameToAuthEmail,
  validatePinFormat,
  validateUsernameFormat,
} from '@/lib/usernameAuth'
import type { Profile } from '@/types'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const authReady = ref(false)
  let initialized = false

  const isLoggedIn = computed(() => !!user.value)

  const isAdmin = computed(
    () =>
      user.value?.app_metadata?.role === 'admin' ||
      user.value?.email?.toLowerCase() === ADMIN_EMAIL,
  )

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      profile.value = data as Profile
    }
  }

  async function init() {
    if (initialized) {
      if (!authReady.value) await waitForAuthReady()
      return
    }
    initialized = true

    try {
      const oauthCallback = hasOAuthCallbackInUrl()

      const { data, error } = await supabase.auth.getSession()
      if (error) console.error('Error al restaurar sesión:', error.message)

      user.value = data.session?.user ?? null
      // No bloquear el arranque: en redes móviles lentas await fetchProfile
      // deja la app en el splash sin montar.
      if (user.value) void fetchProfile(user.value.id)

      if (oauthCallback && data.session) {
        cleanupOAuthUrl()
      }

      // No usar async/await aquí: bloquea getSession() y deja la app sin montar tras OAuth.
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        user.value = session?.user ?? null
        if (user.value) {
          void fetchProfile(user.value.id)
        } else {
          profile.value = null
        }

        if (oauthCallback && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          cleanupOAuthUrl()
        }
      })
    } finally {
      authReady.value = true
    }
  }

  function waitForAuthReady(): Promise<void> {
    if (authReady.value) return Promise.resolve()
    return new Promise((resolve) => {
      const stop = setInterval(() => {
        if (authReady.value) {
          clearInterval(stop)
          resolve()
        }
      }, 10)
    })
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    })
    if (error) throw error
  }

  async function isUsernameTaken(displayUsername: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', displayUsername.trim())
      .maybeSingle()

    if (error) throw error
    return !!data
  }

  async function loginWithUsername(username: string, pin: string) {
    const validationError = validateUsername(username)
    if (validationError) throw new Error(validationError)

    const pinError = validatePinFormat(pin)
    if (pinError) throw new Error(pinError)

    const trimmed = username.trim()
    const email = usernameToAuthEmail(trimmed)
    const password = await deriveAuthPassword(trimmed, pin)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      user.value = data.user
      clearStoredAuthPassword(trimmed)
      await fetchProfile(data.user.id)
      return
    }

    if (error && !error.message.toLowerCase().includes('invalid login credentials')) {
      throw error
    }

    const legacyPassword = getStoredAuthPassword(trimmed)
    if (legacyPassword) {
      const { data: legacyData, error: legacyError } = await supabase.auth.signInWithPassword({
        email,
        password: legacyPassword,
      })
      if (!legacyError && legacyData.user) {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        clearStoredAuthPassword(trimmed)
        user.value = legacyData.user
        await fetchProfile(legacyData.user.id)
        return
      }
    }

    if (await isUsernameTaken(trimmed)) {
      throw new Error('Nombre o PIN incorrectos.')
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: trimmed },
      },
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        throw new Error('Nombre o PIN incorrectos.')
      }
      throw signUpError
    }

    if (!signUpData.user) throw new Error('No se pudo crear la cuenta')

    user.value = signUpData.user

    if (!signUpData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      user.value = signInData.user
    }

    if (user.value) await fetchProfile(user.value.id)
    if (profile.value?.username !== trimmed) {
      await updateUsername(trimmed)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  function validateUsername(value: string): string | null {
    return validateUsernameFormat(value)
  }

  async function updateUsername(username: string) {
    if (!user.value) throw new Error('Debes iniciar sesión')

    const validationError = validateUsername(username)
    if (validationError) throw new Error(validationError)

    const trimmed = username.trim()
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', user.value.id)
      .select()
      .single()

    if (error) throw error
    if (data) profile.value = data as Profile
  }

  return {
    user,
    profile,
    authReady,
    isLoggedIn,
    isAdmin,
    init,
    fetchProfile,
    loginWithGoogle,
    loginWithUsername,
    logout,
    updateUsername,
  }
})
