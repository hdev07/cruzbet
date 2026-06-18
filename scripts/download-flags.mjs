/**
 * Descarga las banderas del mundial a public/flags/ para servirlas sin depender de flagcdn.
 * Ejecutar: npm run flags:download
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'flags')

const flags = [
  'mx', 'za', 'kr', 'cz', 'ca', 'ch', 'qa', 'ba', 'br', 'ma', 'ht', 'gb-sct',
  'us', 'py', 'au', 'tr', 'de', 'cw', 'ci', 'ec', 'nl', 'jp', 'tn', 'se',
  'be', 'eg', 'ir', 'nz', 'es', 'cv', 'sa', 'uy', 'fr', 'sn', 'no', 'iq',
  'ar', 'dz', 'at', 'jo', 'pt', 'uz', 'co', 'cd', 'gb-eng', 'hr', 'gh', 'pa',
]

async function downloadFlag(slug) {
  const dest = join(OUT_DIR, `${slug}.png`)
  if (existsSync(dest)) {
    console.log(`omitido ${slug}.png (ya existe)`)
    return
  }

  const url = `https://flagcdn.com/w40/${slug}.png`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${url}: HTTP ${response.status}`)
  }

  writeFileSync(dest, Buffer.from(await response.arrayBuffer()))
  console.log(`guardado ${slug}.png`)
}

mkdirSync(OUT_DIR, { recursive: true })

for (const slug of flags) {
  await downloadFlag(slug)
}

console.log(`Listo: ${flags.length} banderas en public/flags/`)
