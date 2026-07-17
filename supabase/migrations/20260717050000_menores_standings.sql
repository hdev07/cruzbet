-- Tabla de minutos de menores (Regla de Menores Liga MX) por competencia.
-- Fuente: ligamx.net — sincronizada por /api/sync-menores.

begin;

alter table public.competitions
  add column if not exists menores_source_url text,
  add column if not exists menores_required_minutes integer,
  add column if not exists menores_max_minutes_per_match integer,
  add column if not exists menores_synced_at timestamptz,
  add column if not exists menores_footnote text;

comment on column public.competitions.menores_source_url is
  'URL de la tabla oficial de menores en ligamx.net para este torneo. Si es null, el sync la descubre desde la home.';

create table if not exists public.menores_standings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_code text not null,
  team_name text not null,
  position integer not null default 0,
  aligned_2003 integer not null default 0,
  minutes_2003 integer not null default 0,
  aligned_2004 integer not null default 0,
  minutes_2004 integer not null default 0,
  aligned_2005 integer not null default 0,
  minutes_2005 integer not null default 0,
  aligned_2006_plus integer not null default 0,
  minutes_2006_plus integer not null default 0,
  selected_players integer not null default 0,
  selected_minutes integer not null default 0,
  players_accumulated integer not null default 0,
  minutes_accumulated integer not null default 0,
  minutes_to_regulation integer not null default 0,
  minutes_remaining integer not null default 0,
  fulfilled boolean not null default false,
  synced_at timestamptz not null default now(),
  unique (competition_id, team_code)
);

create index if not exists menores_standings_competition_pos_idx
  on public.menores_standings (competition_id, position);

alter table public.menores_standings enable row level security;

drop policy if exists "menores_standings_public_read" on public.menores_standings;
create policy "menores_standings_public_read"
  on public.menores_standings
  for select
  to anon, authenticated
  using (true);

grant select on public.menores_standings to anon, authenticated;

-- URL activa Apertura 2026 (se puede dejar null: el sync la resuelve desde ligamx.net).
update public.competitions
set
  menores_required_minutes = coalesce(menores_required_minutes, 1170),
  menores_max_minutes_per_match = coalesce(menores_max_minutes_per_match, 225),
  updated_at = now()
where slug = 'liga-mx-apertura-2026';

commit;
