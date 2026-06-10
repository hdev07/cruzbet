-- Quiniela base/normal: jornadas de 16 partidos, solo L/E/V, 50 pts por acierto, $50 MXN por jornada
-- Ejecutar en SQL Editor de Supabase

-- ── Tablas ──────────────────────────────────────────────────────────────────

create table if not exists public.base_quiniela_rounds (
  id uuid primary key default gen_random_uuid(),
  round_number int not null unique,
  title text not null,
  match_count int not null default 16,
  points_per_hit int not null default 50,
  created_at timestamptz default now()
);

create table if not exists public.base_quiniela_round_matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.base_quiniela_rounds(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  position int not null check (position >= 1 and position <= 16),
  unique (round_id, match_id),
  unique (round_id, position)
);

create index if not exists base_round_matches_round_idx
  on public.base_quiniela_round_matches(round_id);

create index if not exists base_round_matches_match_idx
  on public.base_quiniela_round_matches(match_id);

create table if not exists public.base_predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  round_id uuid not null references public.base_quiniela_rounds(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_winner text not null check (predicted_winner in ('home', 'draw', 'away')),
  points int not null default 0,
  scored_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, round_id, match_id)
);

create index if not exists base_predictions_round_user_idx
  on public.base_predictions(round_id, user_id);

create index if not exists base_predictions_match_idx
  on public.base_predictions(match_id);

-- ── Scoring ─────────────────────────────────────────────────────────────────

create or replace function public.calculate_base_prediction_points(
  pred_winner text,
  actual_home integer,
  actual_away integer,
  points_per_hit integer default 50
) returns integer
language plpgsql
immutable
as $$
declare
  actual_winner text;
begin
  if pred_winner is null then return 0; end if;
  if actual_home > actual_away then actual_winner := 'home';
  elsif actual_home < actual_away then actual_winner := 'away';
  else actual_winner := 'draw';
  end if;
  if pred_winner = actual_winner then return points_per_hit;
  end if;
  return 0;
end;
$$;

create or replace function public.score_base_predictions_for_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  m record;
  pts integer;
begin
  select home_score, away_score, status
  into m
  from matches
  where id = p_match_id;

  if m.status != 'finished' then
    return;
  end if;

  for pred in
    select bp.*, r.points_per_hit
    from base_predictions bp
    join base_quiniela_rounds r on r.id = bp.round_id
    where bp.match_id = p_match_id
      and bp.scored_at is null
  loop
    pts := calculate_base_prediction_points(
      pred.predicted_winner,
      m.home_score,
      m.away_score,
      pred.points_per_hit
    );

    update base_predictions
    set points = pts,
        scored_at = now(),
        updated_at = now()
    where id = pred.id;
  end loop;
end;
$$;

create or replace function public.on_match_finished_score_base()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status = 'finished' or NEW.status != 'finished' then
    return NEW;
  end if;

  perform score_base_predictions_for_match(NEW.id);
  return NEW;
end;
$$;

drop trigger if exists match_finished_score_base_trigger on public.matches;
create trigger match_finished_score_base_trigger
  after update on public.matches
  for each row execute function public.on_match_finished_score_base();

-- ── Leaderboard view ────────────────────────────────────────────────────────

create or replace view public.base_round_leaderboard
with (security_invoker = true)
as
select
  bp.round_id,
  bp.user_id,
  p.username,
  p.avatar,
  count(*)::int as predictions_count,
  count(*) filter (where bp.points > 0)::int as correct_count,
  coalesce(sum(bp.points), 0)::int as total_points,
  r.match_count,
  (count(*) = r.match_count) as is_complete
from base_predictions bp
join profiles p on p.id = bp.user_id
join base_quiniela_rounds r on r.id = bp.round_id
group by bp.round_id, bp.user_id, p.username, p.avatar, r.match_count;

-- ── Seed: dividir partidos en jornadas de 16 ───────────────────────────────

create or replace function public.seed_base_quiniela_rounds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  current_round_id uuid;
  current_round_num int := 0;
  pos int := 0;
  rounds_created int := 0;
begin
  for m in
    select id
    from matches
    where match_date is not null
    order by match_date asc, created_at asc
  loop
    if pos = 0 then
      current_round_num := current_round_num + 1;
      insert into base_quiniela_rounds (round_number, title, match_count, points_per_hit)
      values (
        current_round_num,
        'Jornada ' || current_round_num,
        16,
        50
      )
      on conflict (round_number) do update
        set title = excluded.title
      returning id into current_round_id;
      rounds_created := rounds_created + 1;
    end if;

    pos := pos + 1;

    insert into base_quiniela_round_matches (round_id, match_id, position)
    values (current_round_id, m.id, pos)
    on conflict (round_id, match_id) do update
      set position = excluded.position;

    if pos >= 16 then
      pos := 0;
    end if;
  end loop;

  return rounds_created;
end;
$$;

select public.seed_base_quiniela_rounds();

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.base_quiniela_rounds enable row level security;
alter table public.base_quiniela_round_matches enable row level security;
alter table public.base_predictions enable row level security;

drop policy if exists "public read base rounds" on public.base_quiniela_rounds;
create policy "public read base rounds"
  on public.base_quiniela_rounds for select
  using (true);

drop policy if exists "public read base round matches" on public.base_quiniela_round_matches;
create policy "public read base round matches"
  on public.base_quiniela_round_matches for select
  using (true);

drop policy if exists "public read base predictions" on public.base_predictions;
create policy "public read base predictions"
  on public.base_predictions for select
  using (true);

drop policy if exists "users insert own base predictions" on public.base_predictions;
create policy "users insert own base predictions"
  on public.base_predictions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users update own base predictions" on public.base_predictions;
create policy "users update own base predictions"
  on public.base_predictions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users delete own base predictions" on public.base_predictions;
create policy "users delete own base predictions"
  on public.base_predictions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.base_quiniela_rounds to anon, authenticated;
grant select on public.base_quiniela_round_matches to anon, authenticated;
grant select, insert, update, delete on public.base_predictions to authenticated;
grant select on public.base_predictions to anon;
grant select on public.base_round_leaderboard to anon, authenticated;

notify pgrst, 'reload schema';
