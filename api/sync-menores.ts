/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { fetchMenoresSnapshot } from './lib/ligamx-menores.js'
import { isAuthorizedSyncRequest } from './lib/sync-engine.js'

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
      .select(
        'id, slug, menores_source_url, menores_required_minutes, menores_max_minutes_per_match',
      )
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
      process.env.LIGA_MX_MENORES_URL?.trim() ||
      (competition.menores_source_url as string | null)

    const snapshot = await fetchMenoresSnapshot(configuredUrl)
    const syncedAt = snapshot.fetchedAt

    const payload = snapshot.rows.map((row) => ({
      competition_id: competition.id,
      team_code: row.teamCode,
      team_name: row.teamName,
      position: row.position,
      aligned_2003: row.aligned_2003,
      minutes_2003: row.minutes_2003,
      aligned_2004: row.aligned_2004,
      minutes_2004: row.minutes_2004,
      aligned_2005: row.aligned_2005,
      minutes_2005: row.minutes_2005,
      aligned_2006_plus: row.aligned_2006_plus,
      minutes_2006_plus: row.minutes_2006_plus,
      selected_players: row.selected_players,
      selected_minutes: row.selected_minutes,
      players_accumulated: row.players_accumulated,
      minutes_accumulated: row.minutes_accumulated,
      minutes_to_regulation: row.minutes_to_regulation,
      minutes_remaining: row.minutes_remaining,
      fulfilled: row.fulfilled,
      synced_at: syncedAt,
    }))

    const { error: clearError } = await supabase
      .from('menores_standings')
      .delete()
      .eq('competition_id', competition.id)

    if (clearError) throw clearError

    const { error: insertError } = await supabase
      .from('menores_standings')
      .insert(payload)

    if (insertError) throw insertError

    const { error: metaError } = await supabase
      .from('competitions')
      .update({
        menores_source_url: snapshot.sourceUrl,
        menores_required_minutes: snapshot.requiredMinutes,
        menores_max_minutes_per_match: snapshot.maxMinutesPerMatch,
        menores_footnote: snapshot.footnote,
        menores_synced_at: syncedAt,
        updated_at: syncedAt,
      })
      .eq('id', competition.id)

    if (metaError) throw metaError

    return response.status(200).json({
      ok: true,
      competition: ACTIVE_COMPETITION_SLUG,
      source_url: snapshot.sourceUrl,
      required_minutes: snapshot.requiredMinutes,
      max_minutes_per_match: snapshot.maxMinutesPerMatch,
      rows: snapshot.rows.length,
      synced_at: syncedAt,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'sync_menores_failed',
    })
  }
}
