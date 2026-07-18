# Faltas por Jornada (Liga MX)

El panel de **Fair Play** muestra "Faltas" en el resumen del torneo y en la
gráfica "Faltas y tarjetas por Jornada". Esos conteos **no existen en la base
local** (no registramos faltas como evento de partido), así que la fuente es
[ligamx.net/cancha/faltasytarjetas](https://www.ligamx.net/cancha/faltasytarjetas/1).

## Preparación

1. Aplicar la migración:
   - `supabase/migrations/20260717060000_faltas_jornada.sql`
2. En Vercel (mismas vars que el live sync y el sync de menores):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LIVE_SYNC_TOKEN` o `CRON_SECRET`
   - `ACTIVE_COMPETITION_SLUG` (ej. `liga-mx-apertura-2026`)
   - Opcional: `LIGA_MX_FALTAS_URL` si quieres fijar la URL del torneo

## Sync manual

```sh
curl -H "Authorization: Bearer $LIVE_SYNC_TOKEN" \
  https://cruzbet.devifly.dev/api/sync-faltas
```

El endpoint:

1. Usa `LIGA_MX_FALTAS_URL` o `competitions.faltas_source_url`, o bien
   **descubre sola** el enlace `faltasytarjetas` en la home de Liga MX.
2. Descarga el HTML y extrae el bloque `id="btnresetGrafFTARxJor"`, que trae
   el acumulado de **todos los clubes** por Jornada (Amarillas, Rojas y
   Faltas) en su atributo `data-gfSeries`.
3. Guarda una fila por Jornada en `faltas_jornada` ligada a la competencia
   activa y actualiza `competitions.faltas_synced_at`.

La tabla store (`tablasStore`) suma estos valores para el total del torneo o
los filtra por Jornada seleccionada; las tarjetas Amarillas/Rojas siguen
calculándose con los eventos locales de partido, sólo las Faltas vienen de
ligamx.net.

## Torneo a torneo

Al cambiar de Apertura/Clausura:

1. Activar la nueva fila en `competitions` (`ACTIVE_COMPETITION_SLUG`).
2. Dejar `faltas_source_url` en `null` (o pegar la URL nueva del torneo).
3. Correr `/api/sync-faltas`: rediscubre la URL vigente y reemplaza las filas
   de esa competencia.

## Cron

En `vercel.json` hay un cron diario (`0 14 * * *` UTC ≈ 8:00 CDMX) hacia
`/api/sync-faltas`, igual que el de menores. También puedes usar un cron
externo con el mismo `Authorization: Bearer …`.

## Nota

El HTML de ligamx.net trae `<br>` sin escapar dentro de `data-gfSubtitle`, lo
que rompe un regex ingenuo de `<button ...>`. El parser (`api/_lib/ligamx-faltas.ts`)
ubica el tag por el `id` fijo y no por un match de apertura/cierre completo;
si ligamx.net cambia ese `id` (`btnresetGrafFTARxJor`) hay que actualizar el
scraper.
