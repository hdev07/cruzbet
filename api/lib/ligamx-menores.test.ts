import { describe, expect, it } from 'vitest'
import {
  mapClubNameToCode,
  parseMenoresHtml,
} from './ligamx-menores.js'

const SAMPLE_HTML = `
<html><body>
<table>
<thead><tr><th>Club</th></tr></thead>
<tbody>
<tr>
  <td>Necaxa</td><td>4</td><td>226</td><td>2</td><td>114</td><td>1</td><td>36</td>
  <td>0</td><td>0</td><td>0</td><td>0</td><td>7</td><td>376</td><td>225</td><td>945</td>
</tr>
<tr>
  <td>Atlante</td><td>1</td><td>83</td><td>2</td><td>108</td><td>0</td><td>0</td>
  <td>0</td><td>0</td><td>0</td><td>0</td><td>3</td><td>191</td><td>191</td><td>979</td>
</tr>
<tr>
  <td>Guadalajara</td><td>3</td><td>100</td><td>0</td><td>0</td><td>0</td><td>0</td>
  <td>0</td><td>0</td><td>0</td><td>0</td><td>3</td><td>100</td><td>1170</td><td>Cumplió</td>
</tr>
</tbody>
</table>
<div>Menores LIGA MX Reglamento de Competencia LIGA MX, Temporada 2025-2026
Minutos mínimos por Acumular en el Torneo: 1,170
Máximo de minutos a considerar por Partido: 225
Categorías</div>
</body></html>
`

describe('ligamx menores', () => {
  it('mapea nombres de club a códigos', () => {
    expect(mapClubNameToCode('Necaxa')).toBe('NEC')
    expect(mapClubNameToCode('Gallos Blancos de Querétaro')).toBe('QRO')
    expect(mapClubNameToCode('Universidad Nacional')).toBe('PUM')
    expect(mapClubNameToCode('Tigres de la U.A.N.L.')).toBe('TIG')
  })

  it('parsea filas y marca cumplidos', () => {
    const snap = parseMenoresHtml(SAMPLE_HTML, 'https://www.ligamx.net/test')
    expect(snap.requiredMinutes).toBe(1170)
    expect(snap.maxMinutesPerMatch).toBe(225)
    expect(snap.rows).toHaveLength(3)
    expect(snap.rows[0]?.teamCode).toBe('GDL')
    expect(snap.rows[0]?.fulfilled).toBe(true)
    expect(snap.rows[0]?.minutes_remaining).toBe(0)
    expect(snap.rows.find((r) => r.teamCode === 'NEC')?.minutes_remaining).toBe(945)
  })
})
