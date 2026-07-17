-- Faltas totales por Jornada (Estadística de Faltas y Tarjetas Liga MX).
-- Fuente: ligamx.net/cancha/faltasytarjetas — sincronizada por /api/sync-faltas.

begin;

alter table public.competitions
  add column if not exists faltas_source_url text,
  add column if not exists faltas_synced_at timestamptz;

comment on column public.competitions.faltas_source_url is
  'URL de la tabla oficial de faltas y tarjetas en ligamx.net para este torneo. Si es null, el sync la descubre desde la home.';

create table if not exists public.faltas_jornada (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  jornada integer not null,
  fouls integer not null default 0,
  synced_at timestamptz not null default now(),
  unique (competition_id, jornada)
);

create index if not exists faltas_jornada_competition_idx
  on public.faltas_jornada (competition_id, jornada);

alter table public.faltas_jornada enable row level security;

drop policy if exists "faltas_jornada_public_read" on public.faltas_jornada;
create policy "faltas_jornada_public_read"
  on public.faltas_jornada
  for select
  to anon, authenticated
  using (true);

grant select on public.faltas_jornada to anon, authenticated;

commit;
