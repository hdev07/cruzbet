/** Scraper de Faltas y Tarjetas por Jornada (ligamx.net). */

import { absoluteLigamxUrl } from './ligamx-menores.js'

export type LigamxFaltasSnapshot = {
  sourceUrl: string
  /** Faltas totales de todos los clubes, índice 0 = Jornada 1. */
  foulsByJornada: number[]
  totalFouls: number
  fetchedAt: string
}

const HOME_URL = 'https://www.ligamx.net/'
const USER_AGENT =
  'Mozilla/5.0 (compatible; CruzBetFaltasSync/1.0; +https://cruzbet.devifly.dev)'

/** Descubre el enlace vigente de Faltas y Tarjetas en la home de Liga MX. */
export async function discoverFaltasTableUrl(): Promise<string> {
  const res = await fetch(HOME_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) {
    throw new Error(`No se pudo abrir ligamx.net (${res.status})`)
  }
  const html = await res.text()
  const match = html.match(/href="([^"]*faltasytarjetas[^"]*)"/i)
  if (!match?.[1]) {
    throw new Error('No se encontró el enlace de faltas y tarjetas en ligamx.net')
  }
  return absoluteLigamxUrl(match[1].replace(/&amp;/g, '&'))
}

/** Extrae la serie numérica (p.ej. "Faltas") de un valor data-gfSeries. */
function extractSeries(gfSeries: string, seriesName: string): number[] | null {
  for (const part of gfSeries.split(';')) {
    const sepIndex = part.indexOf(':')
    if (sepIndex === -1) continue
    const name = part.slice(0, sepIndex).split(',')[0]?.trim()
    if (name !== seriesName) continue
    const arrMatch = part.slice(sepIndex + 1).match(/\[([^\]]*)\]/)
    if (!arrMatch) continue
    return arrMatch[1]
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((v) => {
        const n = Number.parseInt(v, 10)
        return Number.isFinite(n) ? n : 0
      })
  }
  return null
}

/** Parsea el HTML oficial de Faltas y Tarjetas y extrae las faltas por Jornada. */
export function parseFaltasHtml(html: string, sourceUrl: string): LigamxFaltasSnapshot {
  // Nota: no se puede usar un regex `<button[^>]*id="...">` de una sola pasada porque
  // data-gfSubtitle trae "<br>" literales que rompen [^>]* antes de llegar al id.
  const idAnchor = 'id="btnresetGrafFTARxJor"'
  const idIndex = html.indexOf(idAnchor)
  const tagStart = idIndex === -1 ? -1 : html.lastIndexOf('<button', idIndex)
  const tagEnd = idIndex === -1 ? -1 : html.indexOf('>', idIndex)
  if (tagStart === -1 || tagEnd === -1) {
    throw new Error('No se encontró el bloque de Faltas y tarjetas por Jornada')
  }
  const tag = html.slice(tagStart, tagEnd + 1)

  const seriesMatch = tag.match(/data-gfSeries="([^"]*)"/i)
  if (!seriesMatch?.[1]) {
    throw new Error('El bloque de Faltas y tarjetas por Jornada no tiene data-gfSeries')
  }

  const foulsByJornada = extractSeries(seriesMatch[1], 'Faltas')
  if (!foulsByJornada || !foulsByJornada.length) {
    throw new Error('No se pudo extraer la serie de Faltas')
  }

  return {
    sourceUrl,
    foulsByJornada,
    totalFouls: foulsByJornada.reduce((sum, n) => sum + n, 0),
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchFaltasSnapshot(
  sourceUrl?: string | null,
): Promise<LigamxFaltasSnapshot> {
  const url = sourceUrl?.trim() || (await discoverFaltasTableUrl())
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) {
    throw new Error(`Error al descargar tabla de faltas (${res.status})`)
  }
  const html = await res.text()
  return parseFaltasHtml(html, url)
}
