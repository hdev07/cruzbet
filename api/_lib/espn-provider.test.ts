import { describe, expect, it } from 'vitest'
import { parseClockDisplay } from './clock.js'
import {
  canonicalTeamName,
  espnScoreboardDateRange,
  eventsMatchScore,
  findEspnEvent,
  getEspnDateCandidates,
  isHalftimeStatus,
  normalizeEspnClock,
  normalizeEspnEvents,
  normalizeEspnPlay,
  normalizeEspnStatusDetail,
  type EspnEvent,
} from './espn-provider.js'

describe('reloj ESPN', () => {
  it('separa minuto regular y tiempo agregado', () => {
    expect(parseClockDisplay("90'+5'")).toEqual({
      minute: 90,
      extra_time: 5,
    })
    expect(parseClockDisplay("45+2'")).toEqual({
      minute: 45,
      extra_time: 2,
    })
  })

  it('detecta el entretiempo aunque ESPN conserve el último agregado', () => {
    const status = {
      type: {
        state: 'in',
        name: 'STATUS_HALFTIME',
        description: 'Halftime',
        detail: "45'+4'",
      },
      displayClock: "45'+4'",
    }

    expect(isHalftimeStatus(status)).toBe(true)
    expect(normalizeEspnClock(status)).toBe('HT')
  })

  it('conserva el tiempo agregado durante el primer tiempo', () => {
    const status = {
      type: {
        state: 'in',
        name: 'STATUS_FIRST_HALF',
        description: 'First Half',
        detail: "45'+4'",
        shortDetail: "45'+4'",
      },
      displayClock: "45'+4'",
    }

    expect(isHalftimeStatus(status)).toBe(false)
    expect(normalizeEspnClock(status)).toBe("45+4'")
  })

  it('mapea estatus interrumpidos de ESPN', () => {
    expect(
      normalizeEspnStatusDetail({
        type: { state: 'pre', name: 'STATUS_DELAYED', description: 'Delayed' },
      }),
    ).toBe('delayed')
    expect(
      normalizeEspnStatusDetail({
        type: {
          state: 'pre',
          name: 'STATUS_POSTPONED',
          description: 'Postponed',
        },
      }),
    ).toBe('postponed')
    expect(
      normalizeEspnStatusDetail({
        type: {
          state: 'in',
          name: 'STATUS_SUSPENDED',
          description: 'Suspended',
          detail: "67'",
        },
        displayClock: "67'",
      }),
    ).toBe('suspended')
    expect(
      normalizeEspnStatusDetail({
        type: {
          state: 'post',
          name: 'STATUS_CANCELED',
          description: 'Canceled',
        },
      }),
    ).toBe('canceled')
  })
})

describe('identificación de equipos', () => {
  it('normaliza nombres distintos usados por ESPN', () => {
    expect(canonicalTeamName('Pumas UNAM')).toBe('pumas')
    expect(canonicalTeamName('Tigres UANL')).toBe('tigres')
    expect(canonicalTeamName('Atlético San Luis')).toBe(
      'atletico de san luis',
    )
  })

  it('exige que local y visitante estén en el lado correcto', () => {
    const event: EspnEvent = {
      id: '401',
      date: '2026-07-17T01:00:00Z',
      competitions: [
        {
          status: {
            type: { state: 'pre', completed: false },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '0',
              team: { id: '229', displayName: 'Necaxa' },
            },
            {
              homeAway: 'away',
              score: '0',
              team: { id: '226', displayName: 'Atlante' },
            },
          ],
        },
      ],
    }

    expect(findEspnEvent([event], 'Necaxa', 'Atlante')?.id).toBe('401')
    expect(findEspnEvent([event], 'Atlante', 'Necaxa')).toBeNull()
  })

  it('empareja por código interno aunque la abreviatura ESPN sea distinta', () => {
    const event: EspnEvent = {
      id: 'nec-leon',
      date: '2026-08-18T01:00:00Z',
      competitions: [
        {
          status: { type: { state: 'post', completed: true } },
          competitors: [
            {
              homeAway: 'home',
              score: '1',
              team: { id: '229', abbreviation: 'NCX', displayName: 'Necaxa' },
            },
            {
              homeAway: 'away',
              score: '2',
              team: { id: '228', abbreviation: 'LEO', displayName: 'León' },
            },
          ],
        },
      ],
    }

    expect(findEspnEvent([event], 'Necaxa', 'León', 'NEC', 'LEO')?.id).toBe(
      'nec-leon',
    )
  })
})

describe('normalización de eventos', () => {
  it('usa el id estable de ESPN para goles y conserva el tipo', () => {
    const event = normalizeEspnPlay(
      {
        id: 'goal-1',
        type: { type: 'own-goal', text: 'Own Goal' },
        scoringPlay: true,
        text: 'Own Goal by Player',
        clock: { value: 3216, displayValue: "54'" },
        team: { id: 'away' },
        participants: [
          { athlete: { id: '10', displayName: 'Jugador' } },
        ],
      },
      'home',
      'away',
    )

    expect(event).toMatchObject({
      external_event_id: 'goal-1',
      event_type: 'goal',
      team_side: 'away',
      minute: 54,
      event_second: 36,
      metadata: {
        goal_type: 'own_goal',
        player: 'Jugador',
      },
    })
  })

  it('actualiza una tarjeta usando el mismo id en vez de duplicarla', () => {
    const yellow = normalizeEspnPlay(
      {
        id: 'card-1',
        type: { type: 'yellow-card' },
        clock: { displayValue: "70'" },
        team: { id: 'home' },
      },
      'home',
      'away',
    )
    const red = normalizeEspnPlay(
      {
        id: 'card-1',
        type: { type: 'red-card' },
        clock: { displayValue: "70'" },
        team: { id: 'home' },
      },
      'home',
      'away',
    )

    expect(yellow?.external_event_id).toBe(red?.external_event_id)
    expect(yellow?.metadata.card_type).toBe('yellow')
    expect(red?.metadata.card_type).toBe('red')
  })

  it('no revive desde commentary un gol retirado de keyEvents por VAR', () => {
    const result = normalizeEspnEvents(
      {
        keyEvents: [],
        commentary: [
          {
            play: {
              id: 'canceled-goal',
              type: { type: 'goal' },
              scoringPlay: true,
              clock: { displayValue: "50'" },
              team: { id: 'home' },
            },
          },
          {
            play: {
              id: 'var-1',
              type: { type: 'var---referee-decision-cancelled' },
              text: 'VAR Decision: Goal cancelled.',
              clock: { displayValue: "51'" },
              team: { id: 'home' },
            },
          },
        ],
      },
      'home',
      'away',
    )

    expect(result.complete).toBe(true)
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      external_event_id: 'var-1',
      event_type: 'var_review',
    })
  })

  it('no autoriza borrados si ESPN omite keyEvents temporalmente', () => {
    expect(normalizeEspnEvents({}, 'home', 'away')).toEqual({
      complete: false,
      events: [],
    })
  })

  it('deduplica eventos repetidos por su id ESPN', () => {
    const goal = {
      id: 'goal-1',
      type: { type: 'goal' },
      scoringPlay: true,
      clock: { displayValue: "20'" },
      team: { id: 'home' },
    }
    const result = normalizeEspnEvents(
      { keyEvents: [goal, goal] },
      'home',
      'away',
    )

    expect(result.events).toHaveLength(1)
  })

  it('impide borrar eventos si los goles no cuadran con el marcador', () => {
    const result = normalizeEspnEvents(
      {
        keyEvents: [
          {
            id: 'goal-1',
            type: { type: 'goal' },
            scoringPlay: true,
            clock: { displayValue: "20'" },
            team: { id: 'home' },
          },
        ],
      },
      'home',
      'away',
    )

    expect(eventsMatchScore(result.events, 2, 0)).toBe(false)
    expect(eventsMatchScore(result.events, 1, 0)).toBe(true)
  })
})

describe('fechas del scoreboard ESPN', () => {
  it('incluye el día local de México cuando el kickoff cae al día siguiente en UTC', () => {
    const dates = getEspnDateCandidates('2026-08-18T01:00:00.000Z')
    expect(dates).toContain('20260817')
    expect(dates).toContain('20260818')
  })

  it('arma un rango YYYYMMDD para pedir toda la jornada en una sola llamada', () => {
    expect(espnScoreboardDateRange(['20260817', '20260815', '20260816'])).toBe(
      '20260815-20260817',
    )
  })
})
