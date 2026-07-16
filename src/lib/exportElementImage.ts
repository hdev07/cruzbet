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

export async function exportElementToPng(
  element: HTMLElement,
  options: ExportElementImageOptions = {},
): Promise<{ dataUrl: string; filename: string }> {
  const filename = options.filename ?? buildExportFilename([APP_NAME, 'tabla'])
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: options.pixelRatio ?? 2,
    backgroundColor: options.backgroundColor ?? '#071426',
    style: {
      // Evita recortes por overflow/sticky al capturar
      overflow: 'visible',
    },
  })
  return { dataUrl, filename }
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
      // Usuario canceló o share falló → descarga
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
    }
  }

  downloadDataUrl(dataUrl, filename)
  return 'downloaded'
}
