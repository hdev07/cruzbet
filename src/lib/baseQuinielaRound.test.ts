import { describe, expect, it } from 'vitest'
import {
  isActiveRoundPastHalfwayByKickoff,
  nextRoundOpensAtMs,
  resolveRoundFillState,
} from './baseQuinielaRound'
import type { BaseQuinielaRound } from '@/types'

const DAY = 24 * 60 * 60 * 1000

function makeRound(n: number): BaseQuinielaRound {
  return {
    id: `round-${n}`,
    competition_id: 'comp-1',
    round_number: n,
    title: `Jornada ${n}`,
    match_count: 9,
    points_per_hit: 1,
  }
}

// J5 arranca el día 0, J6 el día 7, J7 el día 14 → J6 se abre el día 3.5.
const rounds = [makeRound(5), makeRound(6), makeRound(7)]
const kickoffs: Record<string, number | null> = {
  'round-5': 0,
  'round-6': 7 * DAY,
  'round-7': 14 * DAY,
}

describe('nextRoundOpensAtMs', () => {
  it('devuelve el punto medio entre kickoffs', () => {
    expect(nextRoundOpensAtMs('round-5', 'round-6', kickoffs)).toBe(3.5 * DAY)
  })

  it('devuelve null si falta un kickoff', () => {
    expect(nextRoundOpensAtMs('round-5', 'sin-datos', kickoffs)).toBeNull()
  })
})

describe('isActiveRoundPastHalfwayByKickoff', () => {
  it('false antes de que arranque la jornada activa', () => {
    expect(
      isActiveRoundPastHalfwayByKickoff('round-5', 'round-6', kickoffs, -1 * DAY),
    ).toBe(false)
  })

  it('false antes del punto medio, true a partir de él', () => {
    expect(
      isActiveRoundPastHalfwayByKickoff('round-5', 'round-6', kickoffs, 3 * DAY),
    ).toBe(false)
    expect(
      isActiveRoundPastHalfwayByKickoff('round-5', 'round-6', kickoffs, 3.5 * DAY),
    ).toBe(true)
  })
})

describe('resolveRoundFillState', () => {
  it('la jornada activa siempre está abierta', () => {
    const state = resolveRoundFillState('round-5', rounds, kickoffs, 1 * DAY)
    expect(state.open).toBe(true)
  })

  it('la siguiente está cerrada antes del punto medio, con fecha de apertura', () => {
    const state = resolveRoundFillState('round-6', rounds, kickoffs, 1 * DAY)
    expect(state.open).toBe(false)
    expect(state.opensAtMs).toBe(3.5 * DAY)
  })

  it('la siguiente se abre a partir del punto medio', () => {
    const state = resolveRoundFillState('round-6', rounds, kickoffs, 4 * DAY)
    expect(state.open).toBe(true)
  })

  it('jornadas más allá de la siguiente quedan bloqueadas sin fecha', () => {
    const state = resolveRoundFillState('round-7', rounds, kickoffs, 4 * DAY)
    expect(state.open).toBe(false)
    expect(state.opensAtMs).toBeNull()
  })

  it('las jornadas pasadas quedan abiertas (los candados por partido aplican)', () => {
    // Día 8: ya arrancó J6, así que J6 es la activa y J5 quedó atrás.
    expect(resolveRoundFillState('round-5', rounds, kickoffs, 8 * DAY).open).toBe(true)
    expect(resolveRoundFillState('round-6', rounds, kickoffs, 8 * DAY).open).toBe(true)
  })

  it('sin datos de jornadas no bloquea', () => {
    expect(resolveRoundFillState('round-6', [], {}, 1 * DAY).open).toBe(true)
    expect(resolveRoundFillState('desconocida', rounds, kickoffs, 1 * DAY).open).toBe(true)
  })
})
