import type { VercelRequest, VercelResponse } from '@vercel/node'
import { syncMatchStatuses } from '../../server/match-lifecycle'
import { processNewGoals } from '../../server/scoring'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const lifecycle = await syncMatchStatuses()
    const scoring = await processNewGoals()
    return res.status(200).json({ lifecycle, scoring })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return res.status(500).json({ error: message })
  }
}
