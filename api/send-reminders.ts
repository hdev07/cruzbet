/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { isAuthorizedSyncRequest } from './_lib/sync-engine.js'

// Recordatorios Web Push antes de que arranque la jornada:
//  - "No has guardado tu quiniela" → suscriptores sin entrada guardada.
//  - "Falta verificar tu pago"     → suscriptores con entradas sin verificar.
// Invocar vía cron diario (vercel.json). Solo actúa si el primer kickoff de la
// próxima jornada está dentro de la ventana (36 h por defecto).

const ACTIVE_COMPETITION_SLUG =
  process.env.ACTIVE_COMPETITION_SLUG ?? 'liga-mx-apertura-2026'
const REMINDER_WINDOW_HOURS = Number(process.env.REMINDER_WINDOW_HOURS ?? 36)

function getSupabaseAdmin(): SupabaseClient {
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

function configureWebPush(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:hcruz0716@gmail.com'
  if (!publicKey || !privateKey) {
    throw new Error('Faltan VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

type SubscriptionRow = {
  id: number
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

type ReminderPayload = {
  title: string
  body: string
  url: string
  tag: string
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
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
    configureWebPush()
    const supabase = getSupabaseAdmin()

    const { data: competition, error: competitionErr } = await supabase
      .from('competitions')
      .select('id')
      .eq('slug', ACTIVE_COMPETITION_SLUG)
      .eq('is_active', true)
      .single()
    if (competitionErr || !competition) {
      throw competitionErr ?? new Error('Sin competencia activa')
    }

    // Primer kickoff por jornada
    const { data: kickoffRows, error: kickoffErr } = await supabase
      .from('base_quiniela_round_matches')
      .select('round_id, match:matches!inner(match_date, competition_id)')
      .eq('match.competition_id', competition.id)
    if (kickoffErr) throw kickoffErr

    const firstKickoffByRound = new Map<string, string>()
    for (const row of kickoffRows ?? []) {
      const matchDate = (row as unknown as { match: { match_date: string | null } })
        .match?.match_date
      if (!matchDate) continue
      const prev = firstKickoffByRound.get(row.round_id as string)
      if (!prev || matchDate < prev) {
        firstKickoffByRound.set(row.round_id as string, matchDate)
      }
    }

    // Jornada objetivo: la próxima en arrancar dentro de la ventana
    const now = Date.now()
    const windowMs = REMINDER_WINDOW_HOURS * 60 * 60 * 1000
    let targetRoundId: string | null = null
    let targetKickoff: string | null = null
    for (const [roundId, kickoff] of firstKickoffByRound) {
      const kickoffMs = new Date(kickoff).getTime()
      if (kickoffMs <= now || kickoffMs > now + windowMs) continue
      if (!targetKickoff || kickoff < targetKickoff) {
        targetRoundId = roundId
        targetKickoff = kickoff
      }
    }

    if (!targetRoundId || !targetKickoff) {
      return response
        .status(200)
        .json({ ok: true, skipped: 'no_round_in_window' })
    }

    const { data: round, error: roundErr } = await supabase
      .from('base_quiniela_rounds')
      .select('id, title')
      .eq('id', targetRoundId)
      .single()
    if (roundErr || !round) throw roundErr ?? new Error('Jornada no encontrada')

    // Estado de pagos/entradas por usuario en esa jornada
    const { data: payments, error: paymentsErr } = await supabase
      .from('base_round_payments')
      .select('user_id, entry_number, submitted_at, verified')
      .eq('round_id', targetRoundId)
    if (paymentsErr) throw paymentsErr

    const submittedByUser = new Map<string, { submitted: number; unverified: number }>()
    for (const p of payments ?? []) {
      if (!p.submitted_at) continue
      const entry = submittedByUser.get(p.user_id) ?? { submitted: 0, unverified: 0 }
      entry.submitted += 1
      if (!p.verified) entry.unverified += 1
      submittedByUser.set(p.user_id, entry)
    }

    const { data: subscriptions, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
    if (subsErr) throw subsErr

    const kickoffLabel = formatKickoff(targetKickoff)
    const url = `/jornadas/${targetRoundId}`

    let sentMissing = 0
    let sentUnverified = 0
    let removed = 0
    let failed = 0

    for (const sub of (subscriptions ?? []) as SubscriptionRow[]) {
      const status = submittedByUser.get(sub.user_id)

      let payload: ReminderPayload | null = null
      if (!status || status.submitted === 0) {
        payload = {
          title: '⚽ ¡Aún no guardas tu quiniela!',
          body: `${round.title} arranca el ${kickoffLabel}. Marca tus picks antes del kickoff.`,
          url,
          tag: `reminder-picks-${targetRoundId}`,
        }
      } else if (status.unverified > 0) {
        payload = {
          title: '🟡 Falta verificar tu pago',
          body:
            status.unverified === 1
              ? `Tienes 1 quiniela sin pago verificado para ${round.title}. Sube tu comprobante.`
              : `Tienes ${status.unverified} quinielas sin pago verificado para ${round.title}. Sube tus comprobantes.`,
          url,
          tag: `reminder-payment-${targetRoundId}`,
        }
      }

      if (!payload) continue

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        )
        if (payload.tag.startsWith('reminder-picks')) sentMissing += 1
        else sentUnverified += 1
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Suscripción muerta: limpiar
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          removed += 1
        } else {
          failed += 1
        }
      }
    }

    return response.status(200).json({
      ok: true,
      round: round.title,
      kickoff: targetKickoff,
      subscriptions: subscriptions?.length ?? 0,
      sentMissingPicks: sentMissing,
      sentUnverifiedPayment: sentUnverified,
      removedDead: removed,
      failed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error'
    return response.status(500).json({ ok: false, error: message })
  }
}
