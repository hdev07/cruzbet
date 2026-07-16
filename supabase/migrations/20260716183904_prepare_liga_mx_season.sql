-- Preparar la base existente para Liga MX sin eliminar el historial del Mundial.
--
-- IMPORTANTE:
-- 1. Ejecutar este archivo antes de importar partidos de Liga MX.
-- 2. Los registros actuales se archivan bajo "mundial-2026".
-- 3. Usuarios, perfiles, quinielas, pagos, partidos y resultados históricos
--    se conservan sin cambios.

begin;

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  season text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.competitions is
  'Competencias y temporadas que separan el historial del Mundial de Liga MX.';

-- Solo puede existir una competencia activa.
create unique index if not exists competitions_one_active_idx
  on public.competitions ((is_active))
  where is_active;

insert into public.competitions (slug, name, season, is_active)
values ('mundial-2026', 'Copa Mundial FIFA', '2026', false)
on conflict (slug) do update
set
  name = excluded.name,
  season = excluded.season,
  updated_at = now();

insert into public.competitions (slug, name, season, is_active)
values ('liga-mx-apertura-2026', 'Liga MX', 'Apertura 2026', false)
on conflict (slug) do update
set
  name = excluded.name,
  season = excluded.season,
  updated_at = now();

alter table public.matches
  add column if not exists competition_id uuid
  references public.competitions(id);

alter table public.base_quiniela_rounds
  add column if not exists competition_id uuid
  references public.competitions(id);

-- Todo lo existente antes de esta migración pertenece al Mundial.
update public.matches
set competition_id = (
  select id from public.competitions where slug = 'mundial-2026'
)
where competition_id is null;

update public.base_quiniela_rounds
set competition_id = (
  select id from public.competitions where slug = 'mundial-2026'
)
where competition_id is null;

alter table public.matches
  alter column competition_id set not null;

alter table public.base_quiniela_rounds
  alter column competition_id set not null;

create index if not exists matches_competition_date_idx
  on public.matches (competition_id, match_date);

create index if not exists base_rounds_competition_number_idx
  on public.base_quiniela_rounds (competition_id, round_number);

-- round_number deja de ser global: cada competencia puede tener Jornada 1.
alter table public.base_quiniela_rounds
  drop constraint if exists base_quiniela_rounds_round_number_key;

alter table public.base_quiniela_rounds
  drop constraint if exists base_quiniela_rounds_competition_round_key;

alter table public.base_quiniela_rounds
  add constraint base_quiniela_rounds_competition_round_key
  unique (competition_id, round_number);

-- Liga MX usa 9 partidos y 1 punto por acierto. Esto solo cambia defaults;
-- las jornadas históricas conservan sus valores originales.
alter table public.base_quiniela_rounds
  alter column match_count set default 9,
  alter column points_per_hit set default 1;

-- Mantener flexibilidad para jornadas extraordinarias sin alterar históricos.
alter table public.base_quiniela_round_matches
  drop constraint if exists base_quiniela_round_matches_position_check;

alter table public.base_quiniela_round_matches
  add constraint base_quiniela_round_matches_position_check
  check (position >= 1 and position <= 20);

-- Activar Liga MX al final evita tener dos competencias activas durante
-- ejecuciones repetidas.
update public.competitions
set is_active = false, updated_at = now()
where is_active;

update public.competitions
set is_active = true, updated_at = now()
where slug = 'liga-mx-apertura-2026';

alter table public.competitions enable row level security;

drop policy if exists "public read competitions" on public.competitions;
create policy "public read competitions"
  on public.competitions
  for select
  using (true);

grant select on public.competitions to anon, authenticated;

notify pgrst, 'reload schema';

commit;

-- Verificación manual después de ejecutar:
-- select slug, name, season, is_active from public.competitions order by slug;
-- select c.slug, count(*) as matches
-- from public.matches m
-- join public.competitions c on c.id = m.competition_id
-- group by c.slug;
-- select c.slug, count(*) as rounds, count(bp.id) as predictions
-- from public.base_quiniela_rounds r
-- join public.competitions c on c.id = r.competition_id
-- left join public.base_predictions bp on bp.round_id = r.id
-- group by c.slug;
