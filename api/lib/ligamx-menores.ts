/** Scraper de la Tabla de Participación de Menores (ligamx.net). */

export type LigamxMenoresRow = {
  teamCode: string
  teamName: string
  position: number
  aligned_2003: number
  minutes_2003: number
  aligned_2004: number
  minutes_2004: number
  aligned_2005: number
  minutes_2005: number
  aligned_2006_plus: number
  minutes_2006_plus: number
  selected_players: number
  selected_minutes: number
  players_accumulated: number
  minutes_accumulated: number
  minutes_to_regulation: number
  minutes_remaining: number
  fulfilled: boolean
}

export type LigamxMenoresSnapshot = {
  sourceUrl: string
  requiredMinutes: number
  maxMinutesPerMatch: number
  footnote: string | null
  rows: LigamxMenoresRow[]
  fetchedAt: string
}

const HOME_URL = 'https://www.ligamx.net/'
const USER_AGENT =
  'Mozilla/5.0 (compatible; CruzBetMenoresSync/1.0; +https://cruzbet.devifly.dev)'

/** Nombres oficiales / variantes → código interno Liga MX. */
const CLUB_ALIASES: Array<{ code: string; patterns: RegExp[] }> = [
  { code: 'AME', patterns: [/^am[eé]rica$/i, /^club am[eé]rica$/i, /[aá]guilas/i] },
  { code: 'ATN', patterns: [/^atlante$/i] },
  { code: 'ATS', patterns: [/^atlas$/i] },
  { code: 'ASL', patterns: [/san luis/i, /atl[eé]tico de san luis/i] },
  { code: 'TIJ', patterns: [/tijuana/i, /xolos/i] },
  { code: 'CAZ', patterns: [/cruz azul/i] },
  { code: 'JUA', patterns: [/ju[aá]rez/i, /bravos/i] },
  { code: 'QRO', patterns: [/quer[eé]taro/i, /gallos/i] },
  { code: 'GDL', patterns: [/guadalajara/i, /chivas/i] },
  { code: 'LEO', patterns: [/^le[oó]n$/i, /club le[oó]n/i] },
  { code: 'NEC', patterns: [/necaxa/i] },
  { code: 'PAC', patterns: [/pachuca/i] },
  { code: 'PUE', patterns: [/puebla/i] },
  { code: 'MTY', patterns: [/monterrey/i, /rayados/i] },
  { code: 'SAN', patterns: [/santos/i] },
  { code: 'TIG', patterns: [/tigres/i, /u\.?\s*a\.?\s*n\.?\s*l/i] },
  { code: 'TOL', patterns: [/toluca/i] },
  { code: 'PUM', patterns: [/pumas/i, /universidad nacional/i, /unam/i] },
]

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseIntLoose(value: string): number {
  const cleaned = value.replace(/,/g, '').replace(/[^\d-]/g, '').trim()
  if (!cleaned) return 0
  const n = Number.parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : 0
}

export function mapClubNameToCode(name: string): string | null {
  const normalized = name.trim()
  if (!normalized) return null
  for (const club of CLUB_ALIASES) {
    if (club.patterns.some((re) => re.test(normalized))) return club.code
  }
  return null
}

export function absoluteLigamxUrl(href: string): string {
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return `https:${href}`
  if (href.startsWith('/')) return `https://www.ligamx.net${href}`
  return `https://www.ligamx.net/${href}`
}

/** Descubre el enlace de menores vigente en la home de Liga MX. */
export async function discoverMenoresTableUrl(): Promise<string> {
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
  const match = html.match(/href="([^"]*tablaMnrs[^"]*)"/i)
  if (!match?.[1]) {
    throw new Error('No se encontró el enlace de tabla de menores en ligamx.net')
  }
  return absoluteLigamxUrl(match[1].replace(/&amp;/g, '&'))
}

function extractFootnote(html: string): string | null {
  const pieMatch = html.match(/Menores LIGA MX[\s\S]{0,400}?Categor[^\s]{0,20}/i)
  if (pieMatch) return stripTags(pieMatch[0]).slice(0, 500)

  const bodyText = stripTags(html)
  const idx = bodyText.indexOf('Menores LIGA MX')
  if (idx >= 0) return bodyText.slice(idx, idx + 280).trim()
  return null
}

function extractRequiredMinutes(html: string, footnote: string | null): number {
  const haystack = `${footnote ?? ''} ${stripTags(html)}`
  const m = haystack.match(
    /Minutos m[^\s]*nimos por Acumular en el Torneo:\s*([\d,]+)/i,
  )
  if (m?.[1]) return parseIntLoose(m[1])
  return 1170
}

function extractMaxPerMatch(html: string, footnote: string | null): number {
  const haystack = `${footnote ?? ''} ${stripTags(html)}`
  const m = haystack.match(
    /M[^\s]*ximo de minutos a considerar por Partido:\s*([\d,]+)/i,
  )
  if (m?.[1]) return parseIntLoose(m[1])
  return 225
}

/** Parsea el HTML de la tabla oficial de menores. */
export function parseMenoresHtml(
  html: string,
  sourceUrl: string,
): LigamxMenoresSnapshot {
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch?.[1]) {
    throw new Error('HTML de menores sin <tbody>')
  }

  const rowChunks = tbodyMatch[1].split(/<tr[^>]*>/i).slice(1)
  const rows: LigamxMenoresRow[] = []
  let position = 0

  for (const chunk of rowChunks) {
    const cells = [...chunk.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      stripTags(m[1] ?? ''),
    )
    if (cells.length < 15) continue
    const teamName = cells[0]!
    const teamCode = mapClubNameToCode(teamName)
    if (!teamCode) continue

    const minutesRemainingRaw = cells[14]!
    const fulfilled =
      /cumpl/i.test(minutesRemainingRaw) || parseIntLoose(minutesRemainingRaw) <= 0
    const minutesRemaining = fulfilled ? 0 : parseIntLoose(minutesRemainingRaw)

    position += 1
    rows.push({
      teamCode,
      teamName,
      position,
      aligned_2003: parseIntLoose(cells[1]!),
      minutes_2003: parseIntLoose(cells[2]!),
      aligned_2004: parseIntLoose(cells[3]!),
      minutes_2004: parseIntLoose(cells[4]!),
      aligned_2005: parseIntLoose(cells[5]!),
      minutes_2005: parseIntLoose(cells[6]!),
      aligned_2006_plus: parseIntLoose(cells[7]!),
      minutes_2006_plus: parseIntLoose(cells[8]!),
      selected_players: parseIntLoose(cells[9]!),
      selected_minutes: parseIntLoose(cells[10]!),
      players_accumulated: parseIntLoose(cells[11]!),
      minutes_accumulated: parseIntLoose(cells[12]!),
      minutes_to_regulation: parseIntLoose(cells[13]!),
      minutes_remaining: minutesRemaining,
      fulfilled,
    })
  }

  if (!rows.length) {
    throw new Error('No se pudieron parsear filas de menores')
  }

  // Orden oficial: más minutos al reglamento primero (como en la página).
  rows.sort(
    (a, b) =>
      b.minutes_to_regulation - a.minutes_to_regulation ||
      b.minutes_accumulated - a.minutes_accumulated ||
      a.teamName.localeCompare(b.teamName, 'es'),
  )
  rows.forEach((row, index) => {
    row.position = index + 1
  })

  const footnote = extractFootnote(html)
  return {
    sourceUrl,
    requiredMinutes: extractRequiredMinutes(html, footnote),
    maxMinutesPerMatch: extractMaxPerMatch(html, footnote),
    footnote,
    rows,
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchMenoresSnapshot(
  sourceUrl?: string | null,
): Promise<LigamxMenoresSnapshot> {
  const url = sourceUrl?.trim() || (await discoverMenoresTableUrl())
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) {
    throw new Error(`Error al descargar tabla de menores (${res.status})`)
  }
  const html = await res.text()
  if (/DatosJSON[\s\S]*Error/i.test(html) && !/<tbody/i.test(html)) {
    throw new Error('ligamx.net devolvió error de ruta para menores')
  }
  return parseMenoresHtml(html, url)
}
