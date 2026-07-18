import { describe, expect, it } from 'vitest'
import { parseFaltasHtml } from './ligamx-faltas.js'

const SAMPLE_HTML = `
<html><body>
<button class="btn-verde grafFTARxJor" data-gfCntdr="#divGrafFTARxJor" data-gfCatEjex="Jornada:['1','2','3']" data-gfSeries="Tarjetas Amarillas,#F5D744:[9,0,0];Tarjetas Rojas,#CE2E2E:[1,0,0];Faltas,#ce782e:[31,12,0]" data-gfTitle="Todos los Clubes" data-gfSubtitle="Total Tarjetas Amarillas: 9<br>Total Tarjetas Rojas: 1<br>Total Faltas: 43" data-gfName="" id="btnresetGrafFTARxJor">Total de Tarjetas</button>
</body></html>
`

describe('ligamx faltas', () => {
  it('extrae la serie de Faltas por Jornada aunque data-gfSubtitle traiga <br> literales', () => {
    const snap = parseFaltasHtml(SAMPLE_HTML, 'https://www.ligamx.net/test')
    expect(snap.foulsByJornada).toEqual([31, 12, 0])
    expect(snap.totalFouls).toBe(43)
  })

  it('lanza error si no encuentra el bloque esperado', () => {
    expect(() => parseFaltasHtml('<html></html>', 'https://www.ligamx.net/test')).toThrow()
  })
})
