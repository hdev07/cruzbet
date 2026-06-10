import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchFootballApi } from '../server/football'
import { WORLD_CUP_LEAGUE_ID_STR, WORLD_CUP_SEASON_STR } from '../server/football-config'
import { processNewGoals } from '../server/scoring'

function withWorldCupFilter(params: Record<string, string>): Record<string, string> {
  if (params.live === 'all') {
    return {
      ...params,
      league: WORLD_CUP_LEAGUE_ID_STR,
      season: WORLD_CUP_SEASON_STR,
    }
  }
  return params
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const live = req.query.live as string | undefined
  const id = req.query.id as string | undefined

  try {
    const params: Record<string, string> = {}
    if (live === 'all') params.live = 'all'
    else if (id) params.id = id
    else {
      return res.status(400).json({ error: 'Usa ?live=all o ?id=123' })
    }

    const data = await fetchFootballApi('/fixtures', withWorldCupFilter(params))

    if (live === 'all') {
      processNewGoals().catch(() => {})
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    const status = message.includes('no configurada') ? 503 : 502
    return res.status(status).json({ error: message })
  }
}
