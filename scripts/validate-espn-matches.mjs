/**
 * Valida que cada partido del seed sea encontrable en ESPN (scoreboard + fechas candidatas).
 * Uso: node scripts/validate-espn-matches.mjs
 */

const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

const matches = [
  ['MEX', 'RSA', '2026-06-11', '15:00'],
  ['KOR', 'CZE', '2026-06-11', '22:00'],
  ['CAN', 'BIH', '2026-06-12', '15:00'],
  ['USA', 'PAR', '2026-06-12', '21:00'],
  ['HAI', 'SCO', '2026-06-13', '21:00'],
  ['AUS', 'TUR', '2026-06-13', '00:00'],
  ['BRA', 'MAR', '2026-06-13', '18:00'],
  ['QAT', 'SUI', '2026-06-13', '15:00'],
  ['CIV', 'ECU', '2026-06-14', '19:00'],
  ['GER', 'CUW', '2026-06-14', '13:00'],
  ['NED', 'JPN', '2026-06-14', '16:00'],
  ['SWE', 'TUN', '2026-06-14', '22:00'],
  ['KSA', 'URU', '2026-06-15', '18:00'],
  ['ESP', 'CPV', '2026-06-15', '12:00'],
  ['IRN', 'NZL', '2026-06-15', '21:00'],
  ['BEL', 'EGY', '2026-06-15', '15:00'],
  ['FRA', 'SEN', '2026-06-16', '15:00'],
  ['IRQ', 'NOR', '2026-06-16', '18:00'],
  ['ARG', 'ALG', '2026-06-16', '21:00'],
  ['AUT', 'JOR', '2026-06-16', '00:00'],
  ['GHA', 'PAN', '2026-06-17', '19:00'],
  ['ENG', 'CRO', '2026-06-17', '16:00'],
  ['POR', 'COD', '2026-06-17', '13:00'],
  ['UZB', 'COL', '2026-06-17', '22:00'],
  ['CZE', 'RSA', '2026-06-18', '12:00'],
  ['SUI', 'BIH', '2026-06-18', '15:00'],
  ['CAN', 'QAT', '2026-06-18', '18:00'],
  ['MEX', 'KOR', '2026-06-18', '21:00'],
  ['BRA', 'HAI', '2026-06-19', '21:00'],
  ['SCO', 'MAR', '2026-06-19', '18:00'],
  ['TUR', 'PAR', '2026-06-19', '23:00'],
  ['USA', 'AUS', '2026-06-19', '15:00'],
  ['GER', 'CIV', '2026-06-20', '16:00'],
  ['ECU', 'CUW', '2026-06-20', '20:00'],
  ['NED', 'SWE', '2026-06-20', '13:00'],
  ['TUN', 'JPN', '2026-06-20', '00:00'],
  ['URU', 'CPV', '2026-06-21', '18:00'],
  ['ESP', 'KSA', '2026-06-21', '12:00'],
  ['BEL', 'IRN', '2026-06-21', '15:00'],
  ['NZL', 'EGY', '2026-06-21', '21:00'],
  ['NOR', 'SEN', '2026-06-22', '20:00'],
  ['FRA', 'IRQ', '2026-06-22', '17:00'],
  ['ARG', 'AUT', '2026-06-22', '13:00'],
  ['JOR', 'ALG', '2026-06-22', '23:00'],
  ['ENG', 'GHA', '2026-06-23', '16:00'],
  ['PAN', 'CRO', '2026-06-23', '19:00'],
  ['POR', 'UZB', '2026-06-23', '13:00'],
  ['COL', 'COD', '2026-06-23', '22:00'],
  ['SCO', 'BRA', '2026-06-24', '18:00'],
  ['MAR', 'HAI', '2026-06-24', '18:00'],
  ['SUI', 'CAN', '2026-06-24', '15:00'],
  ['BIH', 'QAT', '2026-06-24', '15:00'],
  ['CZE', 'MEX', '2026-06-24', '21:00'],
  ['RSA', 'KOR', '2026-06-24', '21:00'],
  ['CUW', 'CIV', '2026-06-25', '16:00'],
  ['ECU', 'GER', '2026-06-25', '16:00'],
  ['JPN', 'SWE', '2026-06-25', '19:00'],
  ['TUN', 'NED', '2026-06-25', '19:00'],
  ['TUR', 'USA', '2026-06-25', '22:00'],
  ['PAR', 'AUS', '2026-06-25', '22:00'],
  ['NOR', 'FRA', '2026-06-26', '15:00'],
  ['SEN', 'IRQ', '2026-06-26', '15:00'],
  ['EGY', 'IRN', '2026-06-26', '23:00'],
  ['NZL', 'BEL', '2026-06-26', '23:00'],
  ['CPV', 'KSA', '2026-06-26', '20:00'],
  ['URU', 'ESP', '2026-06-26', '20:00'],
  ['PAN', 'ENG', '2026-06-27', '17:00'],
  ['CRO', 'GHA', '2026-06-27', '17:00'],
  ['ALG', 'AUT', '2026-06-27', '22:00'],
  ['JOR', 'ARG', '2026-06-27', '22:00'],
  ['COL', 'POR', '2026-06-27', '19:30'],
  ['COD', 'UZB', '2026-06-27', '19:30'],
]

function etToUtcIso(date, time) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(
    `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-04:00`,
  )
  return d.toISOString()
}

function formatEspnDateFromMs(ms) {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function getEspnDateCandidates(isoDate) {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return []
  const candidates = new Set()
  for (const offset of [-1, 0, 1]) {
    candidates.add(formatEspnDateFromMs(d.getTime() + offset * 86_400_000))
  }
  return [...candidates]
}

function normalizeCode(code) {
  return code.toUpperCase()
}

function findEspnEvent(events, homeCode, awayCode) {
  const home = normalizeCode(homeCode)
  const away = normalizeCode(awayCode)
  return (
    events.find((ev) => {
      const comp = ev.competitions?.[0]
      if (!comp) return false
      const codes = comp.competitors.map((c) => normalizeCode(c.team.abbreviation))
      return codes.includes(home) && codes.includes(away)
    }) ?? null
  )
}

async function fetchScoreboard(dateYmd) {
  const res = await fetch(`${ESPN_SCOREBOARD}?dates=${dateYmd}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.events ?? []
}

const scoreboardCache = new Map()

async function getEventsForMatch(isoDate) {
  const dates = getEspnDateCandidates(isoDate)
  const lists = []
  for (const dateYmd of dates) {
    if (!scoreboardCache.has(dateYmd)) {
      scoreboardCache.set(dateYmd, await fetchScoreboard(dateYmd))
    }
    lists.push(scoreboardCache.get(dateYmd))
  }
  const byId = new Map()
  for (const list of lists) {
    for (const ev of list) byId.set(ev.id, ev)
  }
  return [...byId.values()]
}

const results = { found: 0, missing: [], checked: 0 }

for (const [home, away, date, time] of matches) {
  results.checked += 1
  const iso = etToUtcIso(date, time)
  const events = await getEventsForMatch(iso)
  const event = findEspnEvent(events, home, away)

  if (event) {
    results.found += 1
    const comp = event.competitions[0]
    const teams = comp.competitors
      .map((c) => `${c.team.abbreviation}(${c.homeAway})`)
      .join(' vs ')
    console.log(`OK  ${home} vs ${away} → ESPN ${event.id} [${teams}] ${event.date}`)
  } else {
    results.missing.push({ home, away, date, time, iso, dates: getEspnDateCandidates(iso) })
    console.log(`MISS ${home} vs ${away} (${date} ${time} ET) fechas: ${getEspnDateCandidates(iso).join(', ')}`)
  }
}

console.log('\n--- Resumen ---')
console.log(`Encontrados: ${results.found}/${results.checked}`)
if (results.missing.length) {
  console.log(`No encontrados (${results.missing.length}):`)
  for (const m of results.missing) {
    console.log(`  - ${m.home} vs ${m.away} @ ${m.date} ${m.time}`)
  }
  process.exitCode = 1
} else {
  console.log('Todos los partidos son encontrables en ESPN.')
}
