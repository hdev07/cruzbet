import { toPng } from 'html-to-image'
import { APP_NAME } from '@/constants/branding'

export type ExportElementImageOptions = {
  filename?: string
  pixelRatio?: number
  backgroundColor?: string
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function buildExportFilename(parts: Array<string | null | undefined>): string {
  const stamp = new Date().toISOString().slice(0, 10)
  const body = parts
    .filter(Boolean)
    .map((p) => slugify(String(p)))
    .filter(Boolean)
    .join('-')
  return `${body || slugify(APP_NAME)}-${stamp}.png`
}

function absoluteUrl(src: string): string {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src
  try {
    return new URL(src, window.location.origin).href
  } catch {
    return src
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(blob)
  })
}

/** Incrusta <img> como data URL para que html-to-image no pierda escudos (CORS / lazy). */
async function inlineImagesForExport(element: HTMLElement): Promise<() => void> {
  const imgs = Array.from(element.querySelectorAll('img'))
  const restores: Array<() => void> = []

  await Promise.all(
    imgs.map(async (img) => {
      const original = img.getAttribute('src')
      if (!original || original.startsWith('data:')) return

      const href = absoluteUrl(original)
      try {
        if (!img.complete || img.naturalWidth === 0) {
          await new Promise<void>((resolve) => {
            const done = () => resolve()
            img.addEventListener('load', done, { once: true })
            img.addEventListener('error', done, { once: true })
            // Si ya estaba cargada entre medias
            if (img.complete) resolve()
          })
        }

        const res = await fetch(href, { mode: 'cors', credentials: 'omit' })
        if (!res.ok) return
        const dataUrl = await blobToDataUrl(await res.blob())
        img.setAttribute('src', dataUrl)
        restores.push(() => {
          if (original) img.setAttribute('src', original)
        })
      } catch {
        // Escudo externo sin CORS: se queda como esté / fallback de código
      }
    }),
  )

  return () => {
    for (const restore of restores) restore()
  }
}

export async function exportElementToPng(
  element: HTMLElement,
  options: ExportElementImageOptions = {},
): Promise<{ dataUrl: string; filename: string }> {
  const filename = options.filename ?? buildExportFilename([APP_NAME, 'tabla'])
  const restoreImages = await inlineImagesForExport(element)

  try {
    // Un frame para que el navegador pinte los data URLs
    await new Promise((r) => requestAnimationFrame(() => r(null)))

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: options.backgroundColor ?? '#151515',
      style: {
        overflow: 'visible',
      },
    })
    return { dataUrl, filename }
  } finally {
    restoreImages()
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function shareOrDownloadPng(
  dataUrl: string,
  filename: string,
  shareTitle: string,
): Promise<'shared' | 'downloaded'> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const file = new File([blob], filename, { type: 'image/png' })

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })

  if (canShareFiles && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        files: [file],
        title: shareTitle,
        text: shareTitle,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
    }
  }

  downloadDataUrl(dataUrl, filename)
  return 'downloaded'
}
