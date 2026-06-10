import { APP_URL } from '@/constants/branding'

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, '')
}

/** URL a la que Supabase redirige tras OAuth (debe estar en Redirect URLs del proyecto). */
export function getAuthRedirectUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) {
    return `${normalizeSiteUrl(configured)}/`
  }

  if (import.meta.env.PROD) {
    return `${normalizeSiteUrl(APP_URL)}/`
  }

  return `${window.location.origin}/`
}
