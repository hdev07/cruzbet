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

    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      user.value = session?.user ?? null
      if (user.value) await fetchProfile(user.value.id)
      else profile.value = null

      if (oauthCallback && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        cleanupOAuthUrl()
      }
    })

    const { data, error } = await supabase.auth.getSession()
    if (error) console.error('Error al restaurar sesión:', error.message)

    user.value = data.session?.user ?? null
    if (user.value) await fetchProfile(user.value.id)

    if (oauthCallback && data.session) {
      cleanupOAuthUrl()
    }
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

  return {
    user,
    profile,
    isLoggedIn,
    isAdmin,
    init,
    fetchProfile,
    loginWithGoogle,
    logout,
  }
})
