import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  isAuthorizedSyncRequest,
  syncEspnMatches,
} from './_lib/sync-engine.js'
import { SyncRequestError } from './_lib/sync-window.js'

function queryValue(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = raw?.trim()
  return trimmed || undefined
}

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

  const matchId = queryValue(request.query.matchId)
  const from = queryValue(request.query.from)
  const to = queryValue(request.query.to)
  const daysRaw = queryValue(request.query.days)
  const days = daysRaw == null ? undefined : Number.parseInt(daysRaw, 10)

  try {
    const result = await syncEspnMatches({ matchId, from, to, days })
    return response.status(result.errors.length ? 207 : 200).json({
      ok: result.errors.length === 0,
      ...result,
      synced_at: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof SyncRequestError) {
      return response.status(error.status).json({
        ok: false,
        error: error.message,
      })
    }

    return response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'sync_failed',
    })
  }
}
