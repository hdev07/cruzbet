# Golazo — Checklist quiniela Mundial 2026

> Meta: PWA **funcional** para jugar la quiniela (predicción de gol + ranking).  
> Stack: Vue 3 · Vite · Pinia · Tailwind · Supabase · deploy Vercel.

**Leyenda:** ✅ Hecho · ⚠️ Parcial · ❌ Pendiente · 🔧 Acción manual (tú en Supabase/Vercel)

---

## Resultado esperado (jueves)

| Requisito | Estado |
|-----------|--------|
| Mostrar partidos en vivo | ✅ (Supabase + admin manual) |
| Mostrar marcador y minuto | ✅ |
| Login rápido (Google) | ✅ |
| Predecir minuto del próximo gol | ✅ |
| Guardar predicciones | ✅ |
| Ranking básico | ✅ |
| Funcionar como PWA en celular | ⚠️ (config base lista, falta probar instalación) |

---

## Día 1 — Base

| Item | Estado | Notas |
|------|--------|-------|
| Proyecto Vue + Vite + TypeScript | ✅ | `mundial-stats/` |
| Vue Router + Pinia | ✅ | |
| Tailwind CSS | ✅ | |
| `vite-plugin-pwa` | ✅ | Manifest + service worker |
| Cliente Supabase | ✅ | `src/lib/supabase.ts` |
| Auth Google OAuth | ✅ | `LoginView.vue` + `authStore` |
| Tabla `profiles` | ✅ | SQL en `predictions_schema.sql` |
| Tabla `predictions` | ✅ | `match_id` = UUID de `matches` (tras `admin_manual_migration.sql`) |
| Layout mobile-first + bottom nav | ✅ | `MobileLayout.vue` |
| Rutas: Login, Home, Match, Ranking | ✅ | `/login` `/` `/match/:id` `/ranking` |
| PWA íconos 192×192 y 512×512 PNG | ⚠️ | Solo SVG (`public/icon-192.svg`, `icon-512.svg`) |
| Íconos maskable para Android | ⚠️ | Mismo SVG como maskable |
| Trigger auto-crear perfil al registrarse | ✅ | `handle_new_user()` en SQL |

---

## Día 2 — Partidos en vivo

| Item | Estado | Notas |
|------|--------|-------|
| API-Football plan de pago | ❌ | Descartado: plan free sin temporada 2026 |
| Partidos live desde API | ❌ | Reemplazado por **admin manual + Supabase** |
| Proxy `/api/football` | ⚠️ | Código existe pero **no se usa** en la app actual |
| Polling / Realtime 30s | ✅ | Realtime Supabase en Home y Match |
| Cards con marcador y minuto | ✅ | `MatchCard.vue` |
| 72 partidos del fixture en DB | ✅ | `supabase/seed_group_stage.sql` |
| Admin inicia partido en vivo | ✅ | `QuinielaControl.vue` |
| Admin actualiza minuto y marcador | ✅ | |
| Home muestra solo partidos `live` | ✅ | + preview de próximos si no hay live |

---

## Día 3 — Predicciones

| Item | Estado | Notas |
|------|--------|-------|
| Página `/match/:id` | ✅ | `MatchView.vue` |
| Input minuto + dropdown equipo | ✅ | |
| Guardar en Supabase `predictions` | ✅ | `predictionStore.ts` |
| Validación: minuto futuro | ✅ | vs `current_minute` |
| Validación: sin duplicados | ✅ | UNIQUE + mensaje UI |
| Validación: partido no terminado | ✅ | Solo `status = live` |
| Mostrar “Tu predicción: Gol X al 72'” | ✅ | |
| Lista de goles del partido | ✅ | Desde `match_events` + Realtime |

---

## Día 4 — Ranking y puntos

| Item | Estado | Notas |
|------|--------|-------|
| Lógica de puntos (100 / 50 / 20 / 10) | ✅ | Trigger SQL `on_goal_scored()` |
| Scoring al registrar gol (admin) | ✅ | Insert en `match_events` tipo `goal` |
| Columna `scored_at` en predictions | ✅ | `admin_manual_migration.sql` |
| Ranking global (`profiles.points`) | ✅ | `/ranking` |
| Ranking por partido | ✅ | “Top del partido” en `MatchView` |
| Tabla `match_goal_events` (API cron) | ⚠️ | Creada en `scoring_schema.sql` pero **scoring real usa trigger**, no API |
| Cron Vercel `/api/cron/score-goals` | ⚠️ | Obsoleto para flujo manual; se puede eliminar |

---

## Día 5 — PWA real + Deploy

| Item | Estado | Notas |
|------|--------|-------|
| Íconos PWA finales (PNG) | ❌ | |
| Splash / manifest pulido | ⚠️ | `theme_color`, `standalone` OK |
| Probar instalación Android | ❌ | |
| Probar instalación iPhone | ❌ | |
| Deploy en Vercel | ❌ | `vercel.json` preparado |
| Variables de entorno en Vercel | ❌ | `VITE_SUPABASE_*` mínimo |
| Dominio propio | ❌ | Opcional |
| Conectar repo GitHub → Vercel | ❌ | |

---

## Panel Admin (flujo actual)

| Item | Estado | Notas |
|------|--------|-------|
| Ruta `/admin` protegida | ✅ | Requiere `app_metadata.role = admin` |
| Un solo flujo: elegir partido del seed | ✅ | `QuinielaControl.vue` |
| Buscar / filtrar partidos | ✅ | Por equipo, estadio, estado |
| Iniciar partido en vivo | ✅ | |
| Actualizar minuto y marcador | ✅ | |
| Registrar gol → puntúa quiniela | ✅ | Trigger automático |
| Finalizar partido | ✅ | |
| Crear partidos nuevos | ❌ | No necesario (ya están en seed) |
| Reiniciar partido finalizado | ❌ | No implementado |
| Editar goles ya registrados | ❌ | No implementado |

---

## SQL — Orden de ejecución en Supabase

Ejecutar en este orden si empiezas desde cero:

1. ✅ `supabase/schema.sql` — equipos, partidos, eventos, RLS base  
2. ✅ `supabase/seed_group_stage.sql` — 48 equipos + 72 partidos  
3. 🔧 `supabase/predictions_schema.sql` — profiles, predictions, RLS  
4. 🔧 `supabase/admin_manual_migration.sql` — `current_minute`, UUID en predictions, trigger de puntos, RLS admin  

> `scoring_schema.sql` es opcional / redundante si ya corriste `admin_manual_migration.sql`.

---

## Configuración manual pendiente (🔧)

| Tarea | Estado | Dónde |
|-------|--------|-------|
| Proyecto Supabase creado | 🔧 | [supabase.com/dashboard](https://supabase.com/dashboard) |
| `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` | 🔧 | Local |
| Google OAuth habilitado | 🔧 | Supabase → Authentication → Providers |
| Redirect URL `http://localhost:5173/**` | 🔧 | Supabase → URL Configuration |
| Tu usuario con rol admin | 🔧 | Users → App Metadata: `{"role":"admin"}` |
| Ejecutar migraciones SQL (si falta alguna) | 🔧 | SQL Editor |
| `SUPABASE_SERVICE_ROLE_KEY` en `.env` | ⚠️ | Solo necesario si usas cron API (ya no obligatorio) |

---

## Deuda técnica / limpieza (opcional)

| Item | Prioridad |
|------|-----------|
| Eliminar código API-Football sin uso (`api/`, `server/football*`, `liveMatchesStore`, `LiveMatchCard`, `football.service`) | Baja |
| Eliminar cron obsoleto en `vercel.json` | Baja |
| Borrar vistas viejas no usadas (`GroupsView`, `PlayersView`, `AboutView`, `MatchEditor`, `LiveMatchControl`) | Baja |
| Íconos PNG reales para stores de apps | Media (antes de deploy) |
| Ranking por partido también en `/ranking` (hoy solo en MatchView) | Baja |

---

## Análisis de capacidades actuales

**Golazo** es una PWA de quiniela para el Mundial 2026. Hoy el flujo está centrado en **predecir el primer gol** (minuto + equipo) y competir en un **ranking global**. Los datos en vivo los carga un admin manualmente en Supabase — no hay integración con API externa activa.

### Qué puede hacer un usuario (logueado)

| Acción | Dónde | Detalle |
|--------|-------|---------|
| Iniciar sesión con Google | `/login` | OAuth vía Supabase; se crea perfil automáticamente |
| Ver partidos abiertos para predecir | `/` | Partidos `scheduled` cuyo kickoff aún no pasó |
| Ver partidos en vivo | `/` | Marcador, minuto y badge EN VIVO; actualización Realtime |
| Predecir el primer gol | `/match/:id` | Minuto (1–120) + equipo local/visitante |
| Editar predicción | `/match/:id` | Solo **antes** del kickoff |
| Ver su predicción bloqueada | `/match/:id` | Tras iniciar el partido; muestra resumen y puntos al finalizar |
| Ver goles del partido | `/match/:id` | Timeline desde `match_events` + Realtime |
| Ver top del partido | `/match/:id` | Ranking de predictores cuando el partido termina |
| Consultar ranking global | `/ranking` | Posición, avatar, puntos acumulados |
| Ver reglas de puntos | `/ranking` | 100 / 50 / 20 / 10 según precisión |
| Instalar como app (PWA) | Navegador | Service worker + manifest; falta validar en dispositivos |

### Qué puede hacer un visitante (sin login)

- Navegar Inicio y ver partidos en vivo o abiertos.
- Entrar al detalle de un partido y ver marcador/goles.
- No puede guardar predicciones ni aparecer en el ranking.

### Qué puede hacer el admin

| Acción | Dónde | Detalle |
|--------|-------|---------|
| Acceder al panel | `/admin` | Requiere `app_metadata.role = admin` |
| Buscar y filtrar partidos | Admin | Por equipo, estadio o estado (`scheduled` / `live` / `finished`) |
| Iniciar partido en vivo | Admin | Pone status `live`, minuto 0, marcador 0-0 |
| Actualizar minuto y marcador | Admin | Sincroniza el estado visible para todos |
| Registrar goles | Admin | Insert en `match_events`; trigger actualiza marcador |
| Finalizar partido | Admin | Dispara reparto de puntos vs. el **primer gol** |
| Admin automático | Supabase | Email `hcruz0716@gmail.com` recibe rol al registrarse |

### Sistema de puntos (al finalizar partido)

| Condición | Puntos |
|-----------|--------|
| Minuto exacto + equipo correcto | 100 |
| ±1 minuto + equipo correcto | 50 |
| ±3 minutos + equipo correcto | 20 |
| Solo equipo correcto | 10 |
| Equipo incorrecto | 0 |
| Partido sin goles | 0 para todos |

### Datos y infraestructura disponibles

- **48 equipos** y **72 partidos** de fase de grupos en seed SQL.
- Tabla `match_events` preparada para más tipos (`corner`, `card`, `penalty`, etc.) — hoy solo se usa `goal`.
- Realtime en `matches` y `match_events` (~30 s o instantáneo según canal).
- Código legacy de API-Football y cron de scoring **sin uso** en el flujo actual.

### Limitaciones conocidas (hoy)

- Predicciones **solo antes del kickoff**; no hay apuestas en vivo durante el partido.
- Un solo tipo de predicción: primer gol (no marcador exacto, córners, tarjetas, MVP, etc.).
- Sin tablas de grupos, goleadores ni estadísticas de jugadores (existían en el blueprint, no en rutas activas).
- Ranking “Por partido” en `/ranking` es placeholder; el ranking real por partido está en `MatchView`.
- Admin no puede reiniciar partidos finalizados ni corregir goles ya registrados.
- Deploy en Vercel, íconos PNG y prueba de instalación PWA pendientes.

---

## Versiones futuras

Roadmap sugerido por impacto y esfuerzo. No está implementado; sirve como guía post-MVP.

### v1.1 — Pulido de producción (corto plazo)

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Deploy Vercel + env vars | Publicar app con `VITE_SUPABASE_*` | Bajo |
| Íconos PNG maskable | Stores Android/iOS y splash correctos | Bajo |
| Validar PWA en móvil | Instalar, offline básico, actualización SW | Bajo |
| Ranking por partido en `/ranking` | Selector de partido + tabla (hoy solo en MatchView) | Bajo |
| Limpieza de código muerto | Quitar API-Football, cron obsoleto, vistas viejas | Bajo |
| Admin: corregir goles | Editar/eliminar eventos mal cargados | Medio |
| Admin: reiniciar partido | Reabrir `finished` → `live` con reset de puntos | Medio |

### v2 — Más juego y social

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Predicciones adicionales | Marcador exacto, total de goles, córners, tarjetas, penales | Alto |
| Múltiples predicciones por partido | Una por categoría con scoring distinto | Alto |
| Ligas privadas / amigos | Grupos con código de invitación y ranking aislado | Alto |
| Perfil de usuario | Historial de predicciones, racha, badges | Medio |
| Notificaciones push | “Partido por empezar”, “Tu predicción puntó”, recordatorios | Medio |
| Compartir predicción | Link o imagen para redes antes del kickoff | Bajo |

### v2.5 — Datos automáticos

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| API-Football (plan 2026) | Partidos live, marcador y eventos sin admin manual | Alto |
| Sincronización híbrida | API como fuente + override manual del admin | Alto |
| Cron de scoring automático | Reactivar `/api/cron/score-goals` si vuelve la API | Medio |

### v3 — Experiencia completa del blueprint

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Tabla de grupos | `/grupos` con posiciones calculadas | Medio |
| Goleadores y stats | `/jugadores` con datos de `players` + eventos | Medio |
| Timeline rica de eventos | Córners, tarjetas, VAR, sustituciones en MatchView | Alto |
| Predicción de MVP / goleador | Pick pre-partido con puntos al final | Medio |
| Modo torneo / brackets | Visualización de eliminatorias | Medio |
| Realtime mejorado | Optimistic UI, reconexión, indicador de latencia | Medio |

### v4 — Escala y monetización (opcional)

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Multi-torneo | Copa América, Champions, ligas locales | Alto |
| Moderación y anti-trampa | Rate limits, auditoría admin, reportes | Medio |
| Analytics | Dashboard de participación y engagement | Medio |
| Patrocinios / premium | Ligas patrocinadas, temas custom | Variable |

---

## Resumen rápido

### Ya puedes usar hoy (si SQL + admin configurados)

1. Login con Google  
2. Admin: elegir partido del seed → iniciar en vivo → llenar resultados  
3. Usuarios: ver partido live → predecir → ver puntos en ranking  

### Falta para “listo para el jueves” en producción

1. 🔧 Confirmar SQL y rol admin en Supabase  
2. ❌ Deploy Vercel + env vars  
3. ❌ Probar PWA instalada en celular  
4. ⚠️ Íconos PNG (recomendado antes de publicar)  

---

*Última actualización: según estado del repo tras pivot a admin manual + seed.*
