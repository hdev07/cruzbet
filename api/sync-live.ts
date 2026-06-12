import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAuthorizedSyncRequest, syncAllLiveMatches } from './lib/sync-engine.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!(await isAuthorizedSyncRequest(authHeader))) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await syncAllLiveMatches()
    return res.status(200).json({
      ok: true,
      ...result,
      at: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return res.status(500).json({ ok: false, error: message })
  }
}
