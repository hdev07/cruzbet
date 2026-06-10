# Blueprint — PWA Estadísticas del Mundial
> Stack: Vue 3 + Vite + TypeScript + Pinia + Tailwind CSS · Supabase (PostgreSQL + Realtime + Auth)  
> Estimado total: ~18 horas · Meta: listo para el jueves

---

## Resumen

| | |
|---|---|
| Fases | 5 |
| Pasos | 21 |
| Estimado | ~18 horas |
| Backend | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| Frontend | Vue 3 · Composition API · Pinia · Vue Router · Tailwind |
| Deploy | Vercel / Netlify |

---

## Secciones de la app

minuto del primer gol,
qué equipo anota,
marcador exacto,
tiros de esquina,
tarjetas,
penales,
fuera de lugar,
MVP,
quién anota,
etc.

Y ganan puntos/ranking.

---

## Flujo de datos

```
Admin carga evento en vivo
  → INSERT en match_events (Supabase)
    → Supabase Realtime notifica suscriptores
      → Pinia store actualiza estado
        → Vue reacciona sin reload
```

---

## Vistas / rutas

| Ruta | Vista | Descripción |
|---|---|---|
| `/` | `HomeView.vue` | Fixture y resultados |
| `/partido/:id` | `MatchView.vue` | Stats del partido en vivo |
| `/grupos` | `GroupsView.vue` | Tabla de posiciones |
| `/jugadores` | `PlayersView.vue` | Goleadores y estadísticas |
| `/admin` | `AdminPanel.vue` | Carga de eventos (protegida) |

---

## Fase 1 — Setup del proyecto
**Estimado: ~1.5h**

### Paso 1 · Crear proyecto Vue 3 con Vite
Scaffold base con TypeScript, Pinia, Vue Router y Tailwind.

```bash
npm create vue@latest mundial-stats
# Seleccionar: TypeScript, Vue Router, Pinia, ESLint
cd mundial-stats
npm install
```

Archivos clave: `src/main.ts`

---

### Paso 2 · Instalar dependencias clave
Supabase JS client, vite-plugin-pwa y otras librerías.

```bash
npm install @supabase/supabase-js
npm install -D vite-plugin-pwa workbox-precaching workbox-routing
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### Paso 3 · Configurar vite-plugin-pwa
Manifest, íconos, strategy workbox, offline fallback.

Archivos clave: `vite.config.ts`, `public/manifest.webmanifest`

```ts
// vite.config.ts (fragmento)
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  vue(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Mundial Stats',
      short_name: 'Mundial',
      theme_color: '#1a1a2e',
      icons: [/* ... */]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    }
  })
]
```

---

### Paso 4 · Estructura de carpetas

```
src/
├── components/
│   ├── match/
│   │   ├── EventTimeline.vue
│   │   ├── GoalsSection.vue
│   │   ├── CornersSection.vue
│   │   ├── CardsSection.vue
│   │   └── OffsideSection.vue
│   ├── shared/
│   │   ├── MatchCard.vue
│   │   └── PlayerStatCard.vue
│   └── admin/
│       ├── EventForm.vue
│       └── MatchEditor.vue
├── composables/
│   ├── useRealtime.ts
│   ├── useAuth.ts
│   └── useGroups.ts
├── stores/
│   ├── matchStore.ts
│   ├── authStore.ts
│   └── teamsStore.ts
├── types/
│   └── index.ts
├── lib/
│   └── supabase.ts
├── views/
│   ├── HomeView.vue
│   ├── MatchView.vue
│   ├── GroupsView.vue
│   ├── PlayersView.vue
│   └── AdminPanel.vue
└── router/
    └── index.ts
```

---

## Fase 2 — Base de datos en Supabase
**Estimado: ~2.5h**

### Paso 5 · Crear proyecto en Supabase
Nuevo proyecto en [supabase.com](https://supabase.com), copiar URL y anon key al `.env`.

```bash
# .env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

### Paso 6 · Schema SQL — tablas core

```sql
-- Equipos
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code char(3) not null unique,
  flag_url text,
  group_name char(1),
  created_at timestamptz default now()
);

-- Partidos
create type match_status as enum ('scheduled', 'live', 'finished');

create table matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  home_score int default 0,
  away_score int default 0,
  status match_status default 'scheduled',
  phase text,           -- 'group', 'r16', 'qf', 'sf', 'final'
  match_date timestamptz,
  venue text,
  created_at timestamptz default now()
);

-- Jugadores
create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  name text not null,
  number int,
  position text,
  created_at timestamptz default now()
);

-- Índices útiles
create index on matches(status);
create index on matches(match_date);
```

---

### Paso 7 · Tabla match_events polimórfica

La clave del diseño: una sola tabla para todos los tipos de evento.

```sql
create type event_type as enum (
  'goal',
  'corner',
  'card',
  'offside',
  'penalty',
  'substitution',
  'var_review'
);

create table match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  team_id uuid references teams(id),
  player_id uuid references players(id),
  event_type event_type not null,
  minute int not null,
  extra_time int default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index on match_events(match_id);
create index on match_events(event_type);
```

**Ejemplos de `metadata` por tipo:**

```jsonc
// goal
{ "type": "header" | "foot" | "penalty" | "own_goal", "assist_player_id": "uuid" }

// card
{ "color": "yellow" | "red" | "second_yellow" }

// corner
{ "result": "goal" | "cleared" | "foul" }

// offside
{ "var_reviewed": true, "overturned": false }

// penalty
{ "in_game": true, "scored": true, "goalkeeper_id": "uuid" }
```

---

### Paso 8 · Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
alter table teams enable row level security;
alter table matches enable row level security;
alter table players enable row level security;
alter table match_events enable row level security;

-- Lectura pública para todos
create policy "public read teams" on teams for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read events" on match_events for select using (true);

-- Escritura solo para admin (metadata role = 'admin')
create policy "admin write matches" on matches
  for all using (
    auth.jwt() ->> 'role' = 'admin'
  );

create policy "admin write events" on match_events
  for all using (
    auth.jwt() ->> 'role' = 'admin'
  );
```

---

### Paso 9 · Habilitar Realtime en match_events

```sql
-- Ejecutar en SQL Editor de Supabase
alter table match_events replica identity full;

-- Agregar la tabla a la publicación de Realtime
alter publication supabase_realtime add table match_events;
alter publication supabase_realtime add table matches;
```

---

## Fase 3 — Vistas principales (Vue)
**Estimado: ~6h**

### Paso 10 · Router y layout base

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  { path: '/', component: () => import('@/views/HomeView.vue') },
  { path: '/grupos', component: () => import('@/views/GroupsView.vue') },
  { path: '/partido/:id', component: () => import('@/views/MatchView.vue') },
  { path: '/jugadores', component: () => import('@/views/PlayersView.vue') },
  {
    path: '/admin',
    component: () => import('@/views/AdminPanel.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAdmin) return '/login'
})

export default router
```

---

### Paso 11 · Vista: fixture y resultados (/)

Componentes: `HomeView.vue`, `MatchCard.vue`

Lógica clave:
- Consumir `matches` con `select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')`
- Agrupar por fase
- Resaltar partidos con `status = 'live'`

---

### Paso 12 · Vista: partido en vivo (/partido/:id)

Componentes: `MatchView.vue`, `EventTimeline.vue`  
Composable: `useRealtime.ts`

```ts
// src/composables/useRealtime.ts
export function useRealtime(matchId: string) {
  const events = ref<MatchEvent[]>([])

  const channel = supabase
    .channel(`match-${matchId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'match_events',
      filter: `match_id=eq.${matchId}`
    }, (payload) => {
      events.value.push(payload.new as MatchEvent)
    })
    .subscribe()

  onUnmounted(() => supabase.removeChannel(channel))

  return { events }
}
```

---

### Paso 13 · Componentes de stats por sección

Cuatro componentes, cada uno recibe los eventos filtrados por tipo:

- `GoalsSection.vue` — filtra `event_type = 'goal'`, muestra minuto + jugador + tipo
- `CornersSection.vue` — agrupa por equipo y tiempo (1T/2T)
- `CardsSection.vue` — diferencia amarillas y rojas, acumuladas por jugador
- `OffsideSection.vue` — listado con indicador de revisión VAR

---

### Paso 14 · Vista: tabla de grupos (/grupos)

Composable: `useGroups.ts`

Lógica:
- Obtener todos los `matches` con status `finished`
- Calcular puntos (3/1/0), diferencia de goles, goles a favor
- Ordenar: puntos → DG → GF → enfrentamiento directo

---

### Paso 15 · Vista: goleadores y stats (/jugadores)

Componentes: `PlayersView.vue`, `PlayerStatCard.vue`

Query sugerida:
```ts
supabase
  .from('match_events')
  .select('player_id, players(name, team_id, teams(name, flag_url))')
  .eq('event_type', 'goal')
  .neq('metadata->>type', 'own_goal')
```

---

## Fase 4 — Panel admin (carga en vivo)
**Estimado: ~3h**

### Paso 16 · Auth con Supabase

```ts
// src/composables/useAuth.ts
export function useAuth() {
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = () => supabase.auth.signOut()

  return { login, logout }
}
```

Para asignar rol admin, en Supabase Dashboard → Authentication → Users → editar usuario → agregar en `raw_user_meta_data`:
```json
{ "role": "admin" }
```

---

### Paso 17 · Panel admin: cargar evento

Componentes: `AdminPanel.vue`, `EventForm.vue`

El formulario debe exponer:
- Selector de partido activo (status = 'live')
- Selector de tipo de evento (`event_type`)
- Campo de minuto + tiempo extra
- Selector de equipo y jugador (filtrado por equipo)
- Campos dinámicos de `metadata` según el tipo seleccionado

```ts
// Insertar evento
const { error } = await supabase
  .from('match_events')
  .insert({
    match_id: selectedMatch.value,
    team_id: selectedTeam.value,
    player_id: selectedPlayer.value,
    event_type: eventType.value,
    minute: minute.value,
    metadata: buildMetadata()
  })
```

---

### Paso 18 · Admin: gestión de partidos

Componente: `MatchEditor.vue`

Acciones:
- Crear partido (equipos, fecha, fase, estadio)
- Cambiar `status` a `live` al inicio del partido
- Cambiar `status` a `finished` + actualizar score final

---

## Fase 5 — PWA, deploy y pulido
**Estimado: ~4h**

### Paso 19 · Service Worker y offline

```ts
// vite.config.ts — workbox strategies
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 }
      }
    }
  ]
}
```

Componente `InstallPrompt.vue` — escucha `beforeinstallprompt` y muestra banner.

---

### Paso 20 · Notificaciones push (opcional)

Flujo:
1. Usuario acepta notificaciones → guardar `PushSubscription` en tabla `push_subscriptions`
2. Al insertar un gol → Supabase Edge Function envía push a todos los suscritos
3. Service Worker recibe el push y muestra la notificación

---

### Paso 21 · Deploy en Vercel

```bash
npm run build
# dist/ generado con PWA assets
```

En Vercel:
- Build command: `npm run build`
- Output directory: `dist`
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

```json
// vercel.json — SPA fallback
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Checklist para el jueves

- [ ] Proyecto Vue 3 corriendo localmente
- [ ] Supabase conectado, tablas creadas
- [ ] Realtime funcionando en `/partido/:id`
- [ ] Admin puede insertar gol y se ve en vivo
- [ ] Corners, tarjetas, fueras de lugar visibles
- [ ] PWA instalable en móvil
- [ ] Deploy en Vercel activo

---

*Generado con Claude · Devifly stack · Vue 3 + Supabase*
