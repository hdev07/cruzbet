import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  backfillMatchTeamStats,
  isAuthorizedSyncRequest,
} from './lib/sync-engine.js'

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

  try {
    const result = await backfillMatchTeamStats()
    return response.status(result.errors.length ? 207 : 200).json({
      ok: result.errors.length === 0,
      ...result,
      synced_at: new Date().toISOString(),
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'backfill_failed',
    })
  }
}
