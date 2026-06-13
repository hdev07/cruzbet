/**
 * Valida que cada partido del seed sea encontrable en ESPN (scoreboard + fechas candidatas).
 * Uso: node scripts/validate-espn-matches.mjs
 */

import { matches, cities, localToUtc } from './generate-group-seed.mjs'

const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

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

for (const [home, away, _group, date, time, _venue, cityKey] of matches) {
  results.checked += 1
  const iso = localToUtc(date, time, cities[cityKey].tz)
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
    results.missing.push({ home, away, date, time, cityKey, iso, dates: getEspnDateCandidates(iso) })
    console.log(
      `MISS ${home} vs ${away} (${date} ${time} local ${cityKey}) fechas: ${getEspnDateCandidates(iso).join(', ')}`,
    )
  }
}

console.log('\n--- Resumen ---')
console.log(`Encontrados: ${results.found}/${results.checked}`)
if (results.missing.length) {
  console.log(`No encontrados (${results.missing.length}):`)
  for (const m of results.missing) {
    console.log(`  - ${m.home} vs ${m.away} @ ${m.date} ${m.time} (${m.cityKey})`)
  }
  process.exitCode = 1
} else {
  console.log('Todos los partidos son encontrables en ESPN.')
}
