/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { fetchFaltasSnapshot } from './_lib/ligamx-faltas.js'
import { isAuthorizedSyncRequest } from './_lib/sync-engine.js'

const ACTIVE_COMPETITION_SLUG =
  process.env.ACTIVE_COMPETITION_SLUG ?? 'liga-mx-apertura-2026'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
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

  try {
    const supabase = getSupabaseAdmin()
    const { data: competition, error: competitionError } = await supabase
      .from('competitions')
      .select('id, slug, faltas_source_url')
      .eq('slug', ACTIVE_COMPETITION_SLUG)
      .eq('is_active', true)
      .single()

    if (competitionError || !competition) {
      throw new Error(
        competitionError?.message ??
          `No existe la competencia activa ${ACTIVE_COMPETITION_SLUG}`,
      )
    }

    const configuredUrl =
      process.env.LIGA_MX_FALTAS_URL?.trim() ||
      (competition.faltas_source_url as string | null)

    const snapshot = await fetchFaltasSnapshot(configuredUrl)
    const syncedAt = snapshot.fetchedAt

    const payload = snapshot.foulsByJornada.map((fouls, index) => ({
      competition_id: competition.id,
      jornada: index + 1,
      fouls,
      synced_at: syncedAt,
    }))

    const { error: clearError } = await supabase
      .from('faltas_jornada')
      .delete()
      .eq('competition_id', competition.id)

    if (clearError) throw clearError

    const { error: insertError } = await supabase
      .from('faltas_jornada')
      .insert(payload)

    if (insertError) throw insertError

    const { error: metaError } = await supabase
      .from('competitions')
      .update({
        faltas_source_url: snapshot.sourceUrl,
        faltas_synced_at: syncedAt,
        updated_at: syncedAt,
      })
      .eq('id', competition.id)

    if (metaError) throw metaError

    return response.status(200).json({
      ok: true,
      competition: ACTIVE_COMPETITION_SLUG,
      source_url: snapshot.sourceUrl,
      total_fouls: snapshot.totalFouls,
      jornadas: snapshot.foulsByJornada.length,
      synced_at: syncedAt,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'sync_faltas_failed',
    })
  }
}
