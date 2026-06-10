import { APP_URL } from '@/constants/branding'

/** URL a la que Supabase redirige tras OAuth (debe estar en Redirect URLs del proyecto). */
export function getAuthRedirectUrl(): string {
  if (import.meta.env.DEV) {
    return `${window.location.origin}/`
  }

  const configured = import.meta.env.VITE_SITE_URL || APP_URL
  return `${configured.replace(/\/$/, '')}/`
}
