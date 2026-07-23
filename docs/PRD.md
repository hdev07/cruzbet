# PRD — CruzBet · Quiniela Liga MX

**Producto:** CruzBet (`cruzbet.devifly.dev`)
**Tagline:** Quiniela Liga MX — "Marca L, E o V en cada jornada de Liga MX."
**Fecha:** 22 de julio de 2026
**Competencia activa:** Liga MX Apertura 2026 (`liga-mx-apertura-2026`)
**Estado:** En producción (evolución de la app original del Mundial 2026, hoy competencia archivada/oculta)

---

## 1. Resumen ejecutivo

CruzBet es una **PWA móvil-first** para organizar una quiniela privada de la Liga MX entre amigos/familia. Cada jornada, los jugadores pagan **$50 MXN por quiniela**, marcan **L (local), E (empate) o V (visitante)** en los partidos de la jornada y compiten por el pozo. La app automatiza todo el ciclo: captura de picks, bloqueo al guardar, marcadores en vivo (sincronizados desde ESPN), calificación automática de aciertos, ranking por jornada, cálculo del pozo y verificación de pagos por el administrador.

Además de la quiniela, la app funciona como un **hub de seguimiento del torneo**: tabla general, goleo, regla de menores, fair play, estadísticas con gráficas, perfiles de equipo y detalle de partido en vivo.

### Objetivos
1. Eliminar la operación manual de la quiniela (hojas de cálculo, capturas por WhatsApp).
2. Dar transparencia total: reglas, pozo, pagos verificados y ranking visibles para todos.
3. Ofrecer experiencia en vivo confiable en redes móviles (offline-first, reconexión, PWA instalable).

### No-objetivos
- No es una casa de apuestas: no procesa dinero dentro de la app (los depósitos son transferencias bancarias externas verificadas manualmente).
- No es multi-liga simultánea: una sola competencia activa a la vez (las anteriores se archivan).
- No hay predicción de marcador exacto: solo resultado 1X2 (L/E/V).

---

## 2. Usuarios y roles

| Rol | Descripción | Acceso |
|---|---|---|
| **Visitante** | No autenticado. | Inicio, jornadas (solo lectura), resultados, tablas, detalle de partido, reglas. |
| **Jugador** | Autenticado (usuario+PIN o Google). | Todo lo anterior + llenar/guardar quinielas, múltiples entradas por jornada, perfil con historial. |
| **Admin** | `app_metadata.role === 'admin'` o email admin. | Panel `/admin`: verificación de pagos, gestión de jornadas/partidos, eventos manuales, live sync, correcciones. |

### Autenticación
- **Usuario + PIN** (flujo principal, pensado para usuarios no técnicos): el usuario elige nombre y PIN; internamente se mapea a email sintético + contraseña derivada en Supabase Auth. Login y registro son el mismo flujo (si el usuario no existe, se crea). Incluye migración transparente de contraseñas legacy almacenadas localmente.
- **Google OAuth** como alternativa, con limpieza de URL post-callback.
- Guard de router con timeout de 4 s para no congelar la navegación en redes lentas.

---

## 3. Alcance funcional

### 3.1 Quiniela por jornada (core)

**Rutas:** `/jornadas`, `/jornadas/:id`, `/jornadas/todas`, `/reglas`

- Cada **jornada** agrupa los partidos programados de Liga MX (histórico: 9 por jornada; el modelo soporta `match_count` variable, hubo migración a 16).
- El jugador marca **L / E / V** por partido; puede cambiar picks libremente mientras la quiniela esté en borrador.
- **Guardar quiniela** requiere tener todos los partidos marcados; al guardar (con modal de confirmación) los picks quedan **bloqueados permanentemente**.
- **Múltiples entradas por jornada:** un jugador puede jugar varias quinielas en la misma jornada (`entry_number`), cada una con **nombre de entrada** opcional y cuota propia de $50 MXN.
- **Jornada activa:** la última cuya jornada siguiente aún no arranca (con piso configurable `MIN_ACTIVE_ROUND`); lógica de "media jornada" por kickoff para transicionar la UI hacia la siguiente jornada.
- **Calificación automática:** al terminar cada partido se evalúa el pick (1 punto por acierto, 0 por fallo). Correcciones de marcador post-partido recalculan puntos.
- Vista de **matriz de predicciones** por jornada (todos los participantes × partidos) una vez iniciada la jornada, con etiquetas de entrada y export a imagen (`html-to-image`).

### 3.2 Pagos y pozo

- **Cuota:** $50 MXN por quiniela/jornada, vía depósito o transferencia (Banco Azteca; cuenta, CLABE y concepto mostrados en `PaymentInfoCard` con datos copiables).
- **Verificación manual:** el admin marca cada entrada como pago **verificado**; solo los depósitos verificados cuentan para el pozo y el ranking oficial.
- **Pozo automático por tramos:** del bruto recaudado se descuenta un % para infraestructura según número de depósitos verificados — **12% (1–10), 10% (11–20), 8% (21+)** — y el resto es el pozo a repartir.
- Chips de estado de pago visibles para el jugador (pendiente/verificado).

### 3.3 Resultados y ranking

**Ruta:** `/resultados` (alias `/ranking`)

- **Leaderboard por jornada:** ordena por **aciertos** y desempata por **puntos**; muestra progreso (`aciertos/partidos`), completitud y estado de verificación.
- **Ganador y top 3** por jornada; manejo de **empates de ganadores**.
- **Historial de todas las jornadas** con resumen: ganador, top 3, "mi entrada", número de participantes.
- Perfil (`/perfil`): estadísticas personales por jornada (gráfica de barras de aciertos), historial, cambio de nombre de usuario, gestión de la PWA (actualización de la app).

### 3.4 Partidos en vivo

- **Sincronización ESPN** (serverless `api/sync-live.ts`, cada 1–2 min vía cron externo): marcador, estado, reloj monotónico, goles, tarjetas, sustituciones, revisiones VAR.
  - Reconciliación idempotente por `(partido, proveedor, id ESPN)`: actualiza sin duplicar, elimina eventos anulados (goles VAR), nunca borra eventos manuales, y el marcador oficial de ESPN prevalece.
  - Ventana de sync: desde 2 h antes hasta 12 h después del kickoff (recoge correcciones tardías).
- **Realtime en el cliente:** Supabase Realtime + `liveSync.ts` para reflejar cambios al instante; `LiveMatchPulse`, reloj de partido (`matchClock`, `useMatchLifecycleClock`), detalles de estado (retrasado/pospuesto/suspendido/cancelado).
- **Detalle de partido** (`/partido/:id`): marcador (incluye marcador reglamentario y penales para liguilla), lista de goles y tarjetas, sede, canales de transmisión con logos (TUDN, Canal 5, Azteca, ESPN, Fox, Prime, Vix, etc.), estadísticas del partido.
- Soporte de **fase eliminatoria/liguilla**: bracket con slots (posición de grupo, mejor tercero, ganador/perdedor de llave), tandas de penales, avance por penales, refresh de bracket.

### 3.5 Tablas y estadísticas

**Rutas:** `/tablas`, `/tablas/equipo/:code`

- **Tabla general** (standings calculados de resultados locales).
- **Goleo individual** (goleadores).
- **Tabla de menores** (Regla de Menores oficial): sincronizada diariamente desde **ligamx.net** (`api/sync-menores.ts`, cron 8:00 CDMX) — minutos acumulados, al reglamento, por cumplir.
- **Fair Play:** tarjetas desde eventos locales + **faltas por jornada** sincronizadas desde ligamx.net (`api/sync-faltas.ts`, cron diario).
- **Estadísticas con gráficas** (componentes propios SVG): goleo, equipos, disciplina — barras rankeadas, duelos, dispersión (scatter), tendencia (línea), barras agrupadas, radar.
- **"Lo mejor del torneo"** (destacados).
- **Perfil de equipo:** rendimiento, historial de partidos, estadísticas de temporada, radar comparativo.

### 3.6 Inicio

**Ruta:** `/`

- **Calendario de fin de semana / jornada** con partidos, horarios y canales.
- **Sección de próximo partido** destacada.

### 3.7 Panel de administración

**Ruta:** `/admin` (solo admin, oculta bottom-nav)

Pestañas: **Resumen · Jornadas · Partidos · Sync**

- **Dashboard:** estadísticas de pagos, conteo de participantes por jornada, partidos en vivo.
- **Verificación de pagos:** por jornada, filtros (todos/verificados/pendientes), marcar verificado.
- **Jornadas:** lista, participantes, reset de quiniela de un jugador, fijar predicción en nombre de un jugador (para quien manda picks por WhatsApp).
- **Partidos:** lista con búsqueda y filtro por estado; detalle con **control de eventos manual** (goles, tarjetas, etc.), corrección de marcadores, reapertura de partidos.
- **Live sync:** panel de monitoreo/disparo de sincronización, errores por partido (`live_sync_error`), toggle `auto_sync_enabled`.

### 3.8 PWA y resiliencia

- **PWA instalable** (`vite-plugin-pwa`): manifest con branding CruzBet, banner de actualización (`AppUpdateBanner`) y flujo de update desde el perfil.
- **Offline-first:** caché local de datos (`offlineCache`), caché de rounds en el store, banner de sin conexión, detección de estado online (`useOnlineStatus`), relectura de sesión al recuperar red.
- **Recuperación de chunks obsoletos** tras deploys (reload automático).
- **Tema claro/oscuro** con toggle persistente.
- SEO/meta por página (`usePageMeta`), locale `es_MX`.

---

## 4. Arquitectura técnica

### Stack
| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 (Composition API, `<script setup>`), TypeScript, Vite 8, Tailwind CSS 4, Pinia, Vue Router 5, Lucide icons |
| Backend | Supabase (Postgres + Auth + Realtime + RLS), funciones serverless Vercel (`api/`) |
| Hosting | Vercel (SPA rewrite + crons), dominio `cruzbet.devifly.dev` |
| Integraciones | ESPN (marcadores en vivo, no contractual), ligamx.net (menores y faltas) |
| Calidad | Vitest, ESLint + oxlint, vue-tsc |

### Datos (principales tablas/entidades)
`competitions` (multi-torneo con slug activo y archivado) · `teams` · `players` · `matches` (marcador, reglamentario, penales, reloj en vivo, broadcast, bracket, flags de sync) · `match_events` (goal/card/corner/offside/penalty/substitution/var_review; fuente manual o ESPN) · `profiles` · `base_quiniela_rounds` · `base_quiniela_round_matches` · `base_predictions` (por entrada) · pagos/submissions por entrada (`verified`, `submitted_at`) · `menores_standings` · `faltas_jornada` · vistas/RPC de leaderboard (incluye no verificados con bandera).

Migraciones versionadas en `supabase/migrations/` + scripts históricos (penales, reapertura de partidos, entradas múltiples, nombre de entrada, verificación de pagos, auth por username, realtime, etc.).

### Serverless (`api/`)
- `sync-live` — sync ESPN (60 s máx; token `LIVE_SYNC_TOKEN`/`CRON_SECRET`; nunca expone `service_role` al navegador).
- `sync-menores`, `sync-faltas` — scraping ligamx.net con autodescubrimiento de URL por torneo; crons diarios.
- `backfill-match-stats` — backfill de estadísticas.

### Cambio de torneo (Apertura ↔ Clausura)
Activar nueva fila en `competitions`, sembrar calendario, dejar URLs de scraping en `null` (se redescubren) y correr los syncs. La UI no requiere cambios; torneos anteriores quedan ocultos vía `HIDDEN_COMPETITION_SLUGS`.

---

## 5. Reglas de negocio (resumen normativo)

1. Cuota: **$50 MXN por quiniela** (entrada), pagada por transferencia antes de guardar.
2. Solo cuentan **pagos verificados** por el admin para pozo y premio.
3. Picks **libres hasta guardar**; guardar exige quiniela completa y es **irreversible**.
4. Acierto = **1 punto**; fallo = 0. Ranking por **aciertos**, desempate por **puntos**.
5. Pozo = bruto − infraestructura (**12% / 10% / 8%** según 1–10 / 11–20 / 21+ verificados).
6. Jornada activa hasta el kickoff del primer partido de la siguiente jornada.
7. Correcciones de marcador (VAR/post-partido) **recalculan puntos** automáticamente.
8. Eventos manuales del admin prevalecen sobre el sync (nunca los borra ESPN).

---

## 6. Requisitos no funcionales

- **Móvil primero:** navegación inferior de 5 pestañas (Inicio, Quiniela, Resultados, Tablas, Perfil); layout `wide` en desktop.
- **Rendimiento:** code-splitting por ruta, skeletons en primera carga (refresh no oculta datos), caché de datos para arranque instantáneo.
- **Resiliencia de red:** timeouts en guards, offline banner, reintento de sesión al volver online, recuperación de chunks tras deploy.
- **Seguridad:** claves de servicio solo en serverless; endpoints de sync protegidos por bearer token; rutas admin protegidas por rol; RLS en Supabase.
- **Tiempo real:** latencia percibida de segundos entre gol en ESPN y la UI (sync 1–2 min + realtime push).
- **Idioma:** 100% español (es_MX), nombres de equipos localizados.

---

## 7. Métricas de éxito sugeridas

- % de quinielas guardadas antes del kickoff (vs. capturas manuales).
- % de pagos verificados antes del inicio de jornada.
- Tiempo admin invertido por jornada (objetivo: < 15 min).
- Retención de jugadores jornada a jornada.
- Errores de sync en vivo por jornada (objetivo: 0 con intervención manual).

## 8. Riesgos y deuda conocida

- **Dependencia de fuentes no contractuales** (ESPN y scraping de ligamx.net): cambios de HTML/API rompen los syncs; mitigado con parsers defensivos, eventos manuales y panel de sync admin.
- **Verificación de pagos manual:** cuello de botella del admin; no hay conciliación bancaria automática.
- **Frecuencia de cron limitada por plan Vercel:** el sync en vivo depende de cron externo para 1–2 min.
- **Nombres de clubes en scraping:** clubes nuevos requieren mapear alias (`CLUB_ALIASES`).
- README aún dice "mundial-stats" (herencia del origen del proyecto).
