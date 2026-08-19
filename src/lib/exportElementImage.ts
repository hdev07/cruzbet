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

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

async function decodeImage(img: HTMLImageElement): Promise<void> {
  await waitForImage(img)
  if (typeof img.decode === 'function') {
    try {
      await img.decode()
    } catch {
      /* decode puede fallar si el recurso es inválido; seguimos */
    }
  }
}

/** Escudos same-origin vía canvas (más fiable que fetch+html-to-image). */
function canvasDataUrlFromImage(img: HTMLImageElement): string | null {
  if (!img.naturalWidth || !img.naturalHeight) return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

async function fetchAsDataUrl(href: string): Promise<string | null> {
  try {
    const res = await fetch(href, { mode: 'cors', credentials: 'omit', cache: 'force-cache' })
    if (!res.ok) return null
    return blobToDataUrl(await res.blob())
  } catch {
    return null
  }
}

async function resolveImageDataUrl(img: HTMLImageElement): Promise<string | null> {
  const raw = img.currentSrc || img.getAttribute('src') || ''
  if (!raw) return null
  if (raw.startsWith('data:')) return raw

  await decodeImage(img)

  const fromCanvas = canvasDataUrlFromImage(img)
  if (fromCanvas) return fromCanvas

  return fetchAsDataUrl(absoluteUrl(raw))
}

/**
 * Clona el nodo fuera del árbol de Vue, incrusta escudos como data URL
 * y captura desde ese clon (evita que Vue restaure el src y que cors/lazy pierdan logos).
 */
async function prepareExportClone(element: HTMLElement): Promise<{
  clone: HTMLElement
  cleanup: () => void
}> {
  const sourceImgs = Array.from(element.querySelectorAll('img'))
  await Promise.all(sourceImgs.map((img) => decodeImage(img)))

  const dataUrls = await Promise.all(sourceImgs.map((img) => resolveImageDataUrl(img)))

  // Fuera de pantalla (sin opacity: el valor se hereda y deja el PNG transparente)
  const host = document.createElement('div')
  host.setAttribute('data-export-host', '')
  const theme = document.documentElement.getAttribute('data-theme')
  if (theme) host.setAttribute('data-theme', theme)
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'

  const clone = element.cloneNode(true) as HTMLElement
  // `position:fixed` + left negativo se copia en el clon; en el SVG de html-to-image
  // el contenido se pinta fuera del viewBox y el PNG queda solo el fondo (negro).
  clone.style.position = 'static'
  clone.style.left = 'auto'
  clone.style.top = 'auto'
  clone.style.right = 'auto'
  clone.style.bottom = 'auto'
  clone.style.inset = 'auto'
  clone.style.transform = 'none'
  clone.style.opacity = '1'
  clone.style.visibility = 'visible'
  clone.style.pointerEvents = 'none'
  clone.style.margin = '0'

  host.appendChild(clone)
  document.body.appendChild(host)

  const cloneImgs = Array.from(clone.querySelectorAll('img'))
  cloneImgs.forEach((img, index) => {
    const dataUrl = dataUrls[index]
    img.removeAttribute('srcset')
    img.loading = 'eager'
    img.decoding = 'sync'
    if (dataUrl) {
      img.src = dataUrl
      // Dimensiones explícitas ayudan a foreignObject de html-to-image
      const source = sourceImgs[index]
      const w = Math.max(1, source?.clientWidth || img.width || 16)
      const h = Math.max(1, source?.clientHeight || img.height || 16)
      img.width = w
      img.height = h
      img.style.width = `${w}px`
      img.style.height = `${h}px`
      img.style.maxWidth = 'none'
      img.style.objectFit = 'contain'
    }
  })

  await Promise.all(cloneImgs.map((img) => decodeImage(img)))
  await new Promise((r) => requestAnimationFrame(() => r(null)))

  const width = Math.ceil(Math.max(clone.scrollWidth, clone.offsetWidth, 1))
  clone.style.width = `${width}px`

  return {
    clone,
    cleanup: () => {
      host.remove()
    },
  }
}

export async function exportElementToPng(
  element: HTMLElement,
  options: ExportElementImageOptions = {},
): Promise<{ dataUrl: string; filename: string }> {
  const filename = options.filename ?? buildExportFilename([APP_NAME, 'tabla'])
  const { clone, cleanup } = await prepareExportClone(element)

  try {
    const width = Math.ceil(Math.max(clone.scrollWidth, clone.offsetWidth, 1))
    const height = Math.ceil(Math.max(clone.scrollHeight, clone.offsetHeight, 1))

    const dataUrl = await toPng(clone, {
      // cacheBust rompe data URLs al añadir ?t=...
      cacheBust: false,
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: options.backgroundColor ?? '#151515',
      width,
      height,
      style: {
        overflow: 'visible',
        position: 'static',
        left: '0px',
        top: '0px',
        transform: 'none',
        opacity: '1',
        visibility: 'visible',
      },
    })
    return { dataUrl, filename }
  } finally {
    cleanup()
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
