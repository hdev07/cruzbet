# Sincronización ESPN Liga MX

La app obtiene marcador, estado, reloj, goles, tarjetas, sustituciones y
revisiones VAR desde ESPN. El navegador nunca recibe la llave `service_role`.

## Preparación

1. Ejecutar en Supabase:
   - `supabase/migrations/20260716183904_prepare_liga_mx_season.sql`
   - `supabase/seed_liga_mx_apertura_2026.sql`
   - `supabase/migrations/20260716192954_espn_live_sync_reconciliation.sql`
2. Configurar en Vercel las variables server-side indicadas en `.env.example`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LIVE_SYNC_TOKEN`
   - `CRON_SECRET` si se usa Vercel Cron
   - `ADMIN_EMAIL`
3. Desplegar y probar:

```sh
curl -H "Authorization: Bearer $LIVE_SYNC_TOKEN" \
  https://cruzbet.devifly.dev/api/sync-live
```

Para sincronizar un partido específico:

```sh
curl -H "Authorization: Bearer $LIVE_SYNC_TOKEN" \
  "https://cruzbet.devifly.dev/api/sync-live?matchId=UUID"
```

## Frecuencia

Invocar el endpoint cada 1–2 minutos. El motor solo consulta partidos de la
competencia activa desde 2 horas antes hasta 12 horas después de su kickoff,
por lo que también recoge correcciones posteriores al final.

La frecuencia permitida por Vercel Cron depende del plan. Si el plan no admite
ejecuciones cada 1–2 minutos, usar un cron externo con el mismo encabezado
`Authorization`.

## Reconciliación

- La combinación `(partido, proveedor, id ESPN)` es única.
- Repetir el mismo snapshot actualiza el evento; no lo duplica.
- Un evento ESPN ausente de un snapshot completo se elimina. Esto cubre goles
  anulados y tarjetas modificadas por VAR.
- Los eventos manuales nunca son eliminados por ESPN.
- Si ESPN entrega marcador pero omite temporalmente `keyEvents`, se actualiza
  el marcador sin borrar eventos existentes.
- Tampoco se eliminan eventos si la cantidad de goles de `keyEvents` no
  coincide con el marcador del snapshot.
- El marcador oficial de ESPN prevalece sobre el conteo local de goles.
- Una corrección de marcador después del final vuelve a calcular los puntos.

ESPN no publica una API contractual para este uso; el endpoint y su estructura
deben monitorearse durante el torneo.
