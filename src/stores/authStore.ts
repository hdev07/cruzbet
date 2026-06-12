import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { cleanupOAuthUrl, hasOAuthCallbackInUrl } from '@/lib/authCallback'
import { getAuthRedirectUrl } from '@/lib/authRedirect'
import { ADMIN_EMAIL } from '@/lib/matchRules'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
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
    if (initialized) return
    initialized = true

    const oauthCallback = hasOAuthCallbackInUrl()

    const { data, error } = await supabase.auth.getSession()
    if (error) console.error('Error al restaurar sesión:', error.message)

    user.value = data.session?.user ?? null
    if (user.value) await fetchProfile(user.value.id)

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

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  function validateUsername(value: string): string | null {
    const trimmed = value.trim()
    if (!trimmed) return 'El nombre no puede estar vacío'
    if (trimmed.length < 2) return 'Mínimo 2 caracteres'
    if (trimmed.length > 30) return 'Máximo 30 caracteres'
    return null
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
    isLoggedIn,
    isAdmin,
    init,
    fetchProfile,
    loginWithGoogle,
    logout,
    updateUsername,
  }
})
