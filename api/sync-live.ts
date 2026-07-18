import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  isAuthorizedSyncRequest,
  syncEspnMatches,
} from './_lib/sync-engine.js'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'GET' && request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  if (!(await isAuthorizedSyncRequest(request.headers.authorization))) {
    return response.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const rawMatchId = request.query.matchId
  const matchId = Array.isArray(rawMatchId) ? rawMatchId[0] : rawMatchId

  try {
    const result = await syncEspnMatches({ matchId })
    return response.status(result.errors.length ? 207 : 200).json({
      ok: result.errors.length === 0,
      ...result,
      synced_at: new Date().toISOString(),
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'sync_failed',
    })
  }
}
