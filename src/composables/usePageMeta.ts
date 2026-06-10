import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE, APP_URL } from '@/constants/branding'

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function usePageMeta() {
  const route = useRoute()

  watchEffect(() => {
    const section = route.meta.title as string | undefined
    const title = section ? `${section} | ${APP_NAME}` : APP_TITLE
    const description = (route.meta.description as string | undefined) ?? APP_DESCRIPTION
    const url = `${APP_URL}${route.fullPath === '/' ? '' : route.fullPath}`

    document.title = title
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', url, 'property')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
  })
}
