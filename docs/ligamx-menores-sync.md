# Tabla de menores (Liga MX)

La pestaña **Tabla de menores** muestra la Regla de Menores oficial
(minutos acumulados / al reglamento / por cumplir). **ESPN no publica esto**;
la fuente es [ligamx.net](https://www.ligamx.net/).

## Preparación

1. Aplicar la migración:
   - `supabase/migrations/20260717050000_menores_standings.sql`
2. En Vercel (mismas vars que el live sync):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LIVE_SYNC_TOKEN` o `CRON_SECRET`
   - `ACTIVE_COMPETITION_SLUG` (ej. `liga-mx-apertura-2026`)
   - Opcional: `LIGA_MX_MENORES_URL` si quieres fijar la URL del torneo

## Sync manual

```sh
curl -H "Authorization: Bearer $LIVE_SYNC_TOKEN" \
  https://cruzbet.devifly.dev/api/sync-menores
```

El endpoint:

1. Usa `LIGA_MX_MENORES_URL` o `competitions.menores_source_url`, o bien
   **descubre sola** el enlace `tablaMnrs` en la home de Liga MX.
2. Descarga el HTML, parsea la tabla y guarda filas en `menores_standings`
   ligadas a la competencia activa.
3. Actualiza meta del torneo: meta de minutos, tope por partido, footnote y
   `menores_synced_at`.

## Torneo a torneo

Al cambiar de Apertura/Clausura:

1. Activar la nueva fila en `competitions` (`ACTIVE_COMPETITION_SLUG`).
2. Dejar `menores_source_url` en `null` (o pegar la URL nueva del torneo).
3. Correr `/api/sync-menores`: rediscubre la URL vigente y reemplaza las filas
   de esa competencia.

No hace falta tocar código de UI; cada competencia tiene su propia tabla.

## Cron

En `vercel.json` hay un cron diario (`0 14 * * *` UTC ≈ 8:00 CDMX) hacia
`/api/sync-menores`. También puedes usar un cron externo con el mismo
`Authorization: Bearer …`.

## Nota

La tabla solo incluye clubes que Liga MX lista y que mapeamos a códigos
internos (`AME`, `GDL`, …). Si un nombre nuevo no matchea, revisar
`api/_lib/ligamx-menores.ts` (`CLUB_ALIASES`).
