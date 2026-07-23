# Recordatorios Web Push

Avisos antes de cada jornada para suscriptores:

- **"⚽ ¡Aún no guardas tu quiniela!"** — usuarios sin ninguna entrada guardada.
- **"🟡 Falta verificar tu pago"** — usuarios con entradas guardadas pero sin
  pago verificado.

El jugador los activa/desactiva en **Perfil → Recordatorios de quiniela**.

## Preparación

1. Generar llaves VAPID (una sola vez):

   ```sh
   npx web-push generate-vapid-keys
   ```

2. Aplicar la migración:
   - `supabase/migrations/20260722020000_push_subscriptions.sql`

3. Variables de entorno:
   - **Cliente (build)**: `VITE_VAPID_PUBLIC_KEY` (la llave pública).
   - **Vercel (server)**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
     `VAPID_SUBJECT` (mailto:), y las ya existentes
     `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
     `LIVE_SYNC_TOKEN`/`CRON_SECRET`, `ACTIVE_COMPETITION_SLUG`.
   - Opcional: `REMINDER_WINDOW_HOURS` (default 36).

4. Redesplegar. El service worker generado importa `push-sw.js`
   (handlers de `push` y `notificationclick`).

## Cómo decide a quién avisar

`/api/send-reminders`:

1. Busca la **próxima jornada** cuyo primer kickoff cae dentro de la ventana
   (36 h). Si no hay, no envía nada (`skipped: no_round_in_window`).
2. Cruza `push_subscriptions` con `base_round_payments` de esa jornada:
   - Sin `submitted_at` → recordatorio de picks.
   - Con entradas `submitted` pero `verified = false` → recordatorio de pago.
   - Todo en orden → no se le envía nada.
3. Limpia suscripciones muertas (endpoints con 404/410).

## Cron (externo — plan Hobby de Vercel)

El plan Hobby de Vercel permite máximo 2 crons y ya están ocupados por
menores/faltas, así que este endpoint se dispara con un **cron externo
gratuito**, igual que `sync-live`.

Con [cron-job.org](https://cron-job.org) (gratis, sin tarjeta):

1. Crear cuenta y **Create cronjob**.
2. **URL**: `https://cruzbet.devifly.dev/api/send-reminders`
3. **Schedule**: diario a las **10:00** con timezone `America/Mexico_City`
   (equivale a `0 16 * * *` UTC).
4. En **Advanced**:
   - Method: `POST`
   - Header: `Authorization` → `Bearer <LIVE_SYNC_TOKEN>`
     (el mismo token que ya usas para el cron externo de `sync-live`).
5. Guardar y usar **Test run** para verificar: la respuesta debe ser
   `{"ok":true,...}` o `{"ok":true,"skipped":"no_round_in_window"}`.

Cualquier otro cron externo (UptimeRobot, GitHub Actions con `schedule`, un
crontab propio) funciona igual: solo necesita hacer GET o POST con ese
encabezado `Authorization`.

Con la ventana de 36 h, para una jornada que arranca el viernes por la noche
el aviso sale el jueves y de nuevo el viernes por la mañana — solo a quienes
les falte algo.

## Prueba manual

```sh
curl -X POST -H "Authorization: Bearer $LIVE_SYNC_TOKEN" \
  https://cruzbet.devifly.dev/api/send-reminders
```

La respuesta incluye conteos: `sentMissingPicks`, `sentUnverifiedPayment`,
`removedDead`, `failed`.

## Notas

- iOS requiere la app **instalada en pantalla de inicio** (iOS 16.4+) para
  recibir push; en Safari "suelto" no funciona.
- La suscripción es por navegador/dispositivo; un usuario puede tener varias.
- Si el usuario bloquea las notificaciones a nivel navegador, la tarjeta del
  perfil lo indica y el botón queda deshabilitado.
