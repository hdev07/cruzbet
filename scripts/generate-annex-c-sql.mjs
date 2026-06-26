/**
 * Genera supabase/fifa_annex_c_data.sql — tabla lookup Anexo C (495 combinaciones)
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ANNEX_C_ROWS, ANNEX_C_WINNERS, buildAnnexCLookup } from './fifaAnnexCData.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'supabase', 'fifa_annex_c_data.sql')

const lookup = buildAnnexCLookup()
const keys = Object.keys(lookup)
if (keys.length !== 495) {
  throw new Error(`Se esperaban 495 combinaciones, hay ${keys.length}`)
}

const values = keys
  .sort()
  .map((key) => {
    const json = JSON.stringify(lookup[key]).replace(/'/g, "''")
    return `  ('${key}', '${json}'::jsonb)`
  })
  .join(',\n')

const sql = `-- Datos Anexo C FIFA — 495 combinaciones de 8 mejores terceros (auto-generado)
-- Fuente: FIFA World Cup 2026 Regulations, Annex C
-- Regenerar: node scripts/generate-annex-c-sql.mjs

create table if not exists public.fifa_annex_c (
  combination_key text primary key,
  assignments jsonb not null
);

truncate public.fifa_annex_c;

insert into public.fifa_annex_c (combination_key, assignments) values
${values};

-- Ganadores de grupo que reciben un tercero en dieciseisavos: ${ANNEX_C_WINNERS.join(', ')}
`

const tsLookup = `// Auto-generado por scripts/generate-annex-c-sql.mjs — no editar a mano
export const FIFA_ANNEX_C_WINNERS = ${JSON.stringify(ANNEX_C_WINNERS)} as const

export const FIFA_ANNEX_C_LOOKUP: Record<string, Record<string, string>> = ${JSON.stringify(lookup, null, 2)}
`

writeFileSync(out, sql, 'utf8')
const tsOut = join(__dirname, '..', 'src', 'data', 'fifaAnnexCLookup.generated.ts')
mkdirSync(dirname(tsOut), { recursive: true })
writeFileSync(tsOut, tsLookup, 'utf8')
console.log(`Generado: ${out} (${keys.length} filas)`)
console.log('Generado: src/data/fifaAnnexCLookup.generated.ts')
