-- Ventana de llenado en el servidor (espeja src/lib/baseQuinielaRound.ts):
-- solo se marcan picks en la jornada activa y en la siguiente, y la siguiente
-- se abre a mitad de la activa (punto medio entre primeros kickoffs).
--
-- Hasta ahora estas reglas (ventana de jornada, kickoff por partido y quiniela
-- guardada) solo vivían en el cliente: cualquier usuario autenticado podía
-- insertar/editar picks vía API en cualquier jornada y a cualquier hora. Esta
-- migración las aplica en RLS. La calificación automática
-- (score_base_predictions_for_match) y los RPCs de admin son security definer,
-- por lo que no les afecta.

-- ── Ventana de jornada ──────────────────────────────────────────────────────

create or replace function public.base_round_fill_open(
  p_round_id uuid,
  p_now timestamptz default now()
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target public.base_quiniela_rounds%rowtype;
  active_number int;
  active_start timestamptz;
  next_id uuid;
  next_start timestamptz;
begin
  select * into target from base_quiniela_rounds where id = p_round_id;
  -- Sin datos no bloqueamos (espeja el cliente); los candados por partido aplican.
  if target.id is null then
    return true;
  end if;

  -- Jornada activa: la última cuyo primer kickoff ya pasó (los kickoffs van en
  -- orden de round_number, igual que resolveActiveBaseRound en el cliente).
  select r.round_number, k.first_kickoff
    into active_number, active_start
  from base_quiniela_rounds r
  join lateral (
    select min(m.match_date) as first_kickoff
    from base_quiniela_round_matches rm
    join matches m on m.id = rm.match_id
    where rm.round_id = r.id
  ) k on true
  where r.competition_id = target.competition_id
    and k.first_kickoff is not null
    and k.first_kickoff <= p_now
  order by r.round_number desc
  limit 1;

  -- Ninguna jornada ha empezado: la activa es la primera.
  if active_number is null then
    select r.round_number into active_number
    from base_quiniela_rounds r
    where r.competition_id = target.competition_id
    order by r.round_number asc
    limit 1;
  end if;

  -- Jornada activa y anteriores: abiertas aquí; cierran partido a partido.
  if target.round_number <= active_number then
    return true;
  end if;

  -- Jornada siguiente a la activa
  select r.id into next_id
  from base_quiniela_rounds r
  where r.competition_id = target.competition_id
    and r.round_number > active_number
  order by r.round_number asc
  limit 1;

  -- Más allá de la siguiente: bloqueada.
  if next_id is null or next_id <> target.id then
    return false;
  end if;

  -- La siguiente se abre a mitad de la activa; sin kickoffs conocidos, cerrada.
  if active_start is null then
    return false;
  end if;

  select min(m.match_date) into next_start
  from base_quiniela_round_matches rm
  join matches m on m.id = rm.match_id
  where rm.round_id = next_id;

  if next_start is null then
    return false;
  end if;

  return p_now >= active_start + (next_start - active_start) / 2;
end;
$$;

-- ── Editabilidad completa de un pick ────────────────────────────────────────
-- Espeja isMatchOpenForPredictions + quiniela guardada + ventana de jornada.

create or replace function public.base_prediction_editable(
  p_round_id uuid,
  p_match_id uuid,
  p_entry_number int
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m public.matches%rowtype;
begin
  if not public.base_round_fill_open(p_round_id) then
    return false;
  end if;

  select * into m from matches where id = p_match_id;
  if m.id is null then
    return false;
  end if;

  -- Partido abierto: no terminado, equipos definidos y kickoff sin pasar
  -- (sin fecha, cuenta como iniciado cuando está live/finished).
  if m.status = 'finished' then
    return false;
  end if;
  if m.home_team_id is null or m.away_team_id is null then
    return false;
  end if;
  if m.match_date is not null then
    if now() >= m.match_date then
      return false;
    end if;
  elsif m.status <> 'scheduled' then
    return false;
  end if;

  -- Quiniela ya guardada: picks bloqueados.
  if exists (
    select 1
    from base_round_payments p
    where p.user_id = (select auth.uid())
      and p.round_id = p_round_id
      and p.entry_number = p_entry_number
      and p.submitted_at is not null
  ) then
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.base_round_fill_open(uuid, timestamptz) to anon, authenticated;
grant execute on function public.base_prediction_editable(uuid, uuid, int) to anon, authenticated;

-- ── Policies ────────────────────────────────────────────────────────────────

drop policy if exists "users insert own base predictions" on public.base_predictions;
create policy "users insert own base predictions"
  on public.base_predictions for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.base_prediction_editable(round_id, match_id, entry_number)
  );

drop policy if exists "users update own base predictions" on public.base_predictions;
create policy "users update own base predictions"
  on public.base_predictions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and public.base_prediction_editable(round_id, match_id, entry_number)
  );

drop policy if exists "users delete own base predictions" on public.base_predictions;
create policy "users delete own base predictions"
  on public.base_predictions for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and public.base_prediction_editable(round_id, match_id, entry_number)
  );

notify pgrst, 'reload schema';
