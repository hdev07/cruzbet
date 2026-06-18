const CACHE_NAME = 'team-flags-v1'

/** Slug ISO a partir de URL flagcdn o ruta local `/flags/xx.png`. */
export function flagSlugFromUrl(flagUrl: string | null | undefined): string | null {
  if (!flagUrl) return null
  const localMatch = flagUrl.match(/^\/flags\/([\w-]+)\.png$/i)
  if (localMatch) return localMatch[1]!.toLowerCase()
  const cdnMatch = flagUrl.match(/flagcdn\.com\/w\d+\/([\w-]+)\.png/i)
  return cdnMatch ? cdnMatch[1]!.toLowerCase() : null
}

export function localFlagPath(flagUrl: string | null | undefined): string | null {
  const slug = flagSlugFromUrl(flagUrl)
  return slug ? `/flags/${slug}.png` : null
}

/** Prioriza banderas empaquetadas en la app; si no hay mapeo, usa el URL remoto. */
export function resolveFlagSrc(flagUrl: string | null | undefined): string | null {
  return localFlagPath(flagUrl) ?? flagUrl ?? null
}

async function openFlagCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(CACHE_NAME)
  } catch {
    return null
  }
}

/** Guarda en caché los URLs remotos para usarlos sin red en visitas posteriores. */
export async function warmFlagCache(
  flagUrls: Iterable<string | null | undefined>,
): Promise<void> {
  const cache = await openFlagCache()
  if (!cache) return

  const seen = new Set<string>()
  const tasks: Promise<void>[] = []

  for (const raw of flagUrls) {
    const url = raw?.trim()
    if (!url || seen.has(url) || url.startsWith('/flags/')) continue
    seen.add(url)

    tasks.push(
      (async () => {
        try {
          if (await cache.match(url)) return
          const response = await fetch(url)
          if (response.ok) await cache.put(url, response.clone())
        } catch {
          // Sin red: se omite en silencio.
        }
      })(),
    )
  }

  await Promise.allSettled(tasks)
}

const blobUrlByRequest = new Map<string, string>()

export async function getCachedFlagBlobUrl(flagUrl: string): Promise<string | null> {
  const existing = blobUrlByRequest.get(flagUrl)
  if (existing) return existing

  const cache = await openFlagCache()
  if (!cache) return null

  const response = await cache.match(flagUrl)
  if (!response) return null

  try {
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    blobUrlByRequest.set(flagUrl, blobUrl)
    return blobUrl
  } catch {
    return null
  }
}
