-- Anexo C FIFA: asignación correcta de los 8 mejores terceros en dieciseisavos
-- Ejecutar en SQL Editor de Supabase DESPUÉS de knockout_bracket_migration.sql
-- y DESPUÉS de fifa_annex_c_data.sql (node scripts/generate-annex-c-sql.mjs)

-- ─── Lookup Anexo C ─────────────────────────────────────────────────────────

create table if not exists public.fifa_annex_c (
  combination_key text primary key,
  assignments jsonb not null
);

create or replace function public._qualifying_third_group_key()
returns text
language sql
stable
as $$
  select coalesce(string_agg(group_name, '' order by group_name), '')
  from public._ranked_third_places()
  where rank <= 8;
$$;

create or replace function public._annex_c_assignments()
returns jsonb
language sql
stable
as $$
  select a.assignments
  from public.fifa_annex_c a
  where a.combination_key = public._qualifying_third_group_key();
$$;

-- ─── Resolver slot con contexto del rival (necesario para best_third) ─────────

create or replace function public._resolve_bracket_slot(
  p_slot jsonb,
  p_opponent_slot jsonb default null,
  p_third_assignments jsonb default null
)
returns uuid
language plpgsql
stable
as $$
declare
  slot_type text := p_slot ->> 'type';
  winner_group text;
  third_group text;
  picked uuid;
begin
  if slot_type = 'group_pos' then
    return public._team_at_group_position(p_slot ->> 'group', (p_slot ->> 'pos')::int);
  end if;

  if slot_type = 'best_third' then
    if p_third_assignments is null or p_opponent_slot is null then
      return null;
    end if;
    if (p_opponent_slot ->> 'type') != 'group_pos' or (p_opponent_slot ->> 'pos')::int != 1 then
      return null;
    end if;
    winner_group := p_opponent_slot ->> 'group';
    third_group := p_third_assignments ->> winner_group;
    if third_group is null then
      return null;
    end if;
    return public._team_at_group_position(third_group, 3);
  end if;

  if slot_type = 'winner' then
    select case
      when m.home_score > m.away_score then m.home_team_id
      when m.away_score > m.home_score then m.away_team_id
      else null
    end into picked
    from matches m
    where m.bracket_key = 'M' || (p_slot ->> 'match')
      and m.status = 'finished';
    return picked;
  end if;

  if slot_type = 'loser' then
    select case
      when m.home_score > m.away_score then m.away_team_id
      when m.away_score > m.home_score then m.home_team_id
      else null
    end into picked
    from matches m
    where m.bracket_key = 'M' || (p_slot ->> 'match')
      and m.status = 'finished';
    return picked;
  end if;

  return null;
end;
$$;

-- ─── Llenar dieciseisavos con Anexo C ───────────────────────────────────────

create or replace function public.fill_knockout_r32_from_groups(p_force boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  home_id uuid;
  away_id uuid;
  home_slot jsonb;
  away_slot jsonb;
  third_assignments jsonb;
  qualifying_key text;
  updated_count int := 0;
  diag jsonb;
begin
  if not p_force and not public._is_group_stage_complete() then
    diag := public.group_stage_diagnostic();
    return jsonb_build_object(
      'ok', false,
      'reason', 'group_stage_incomplete',
      'group_matches_total', diag -> 'group_matches_total',
      'group_finished_total', diag -> 'group_finished_total',
      'groups_pending', (
        select coalesce(jsonb_agg(g), '[]'::jsonb)
        from jsonb_array_elements(diag -> 'groups') g
        where (g ->> 'pending')::int > 0
      ),
      'hint', diag -> 'hint'
    );
  end if;

  qualifying_key := public._qualifying_third_group_key();
  third_assignments := public._annex_c_assignments();

  if third_assignments is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'annex_c_lookup_missing',
      'qualifying_groups', qualifying_key,
      'hint', 'Ejecuta fifa_annex_c_data.sql para cargar la tabla Anexo C (495 combinaciones).'
    );
  end if;

  for m in
    select id, bracket_meta
    from matches
    where phase = 'r32'
    order by (bracket_meta ->> 'match_number')::int
  loop
    home_slot := m.bracket_meta -> 'home';
    away_slot := m.bracket_meta -> 'away';
    home_id := public._resolve_bracket_slot(home_slot, away_slot, third_assignments);
    away_id := public._resolve_bracket_slot(away_slot, home_slot, third_assignments);

    update matches
    set home_team_id = home_id,
        away_team_id = away_id
    where id = m.id
      and (home_team_id is distinct from home_id or away_team_id is distinct from away_id);

    if found then
      updated_count := updated_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'updated', updated_count,
    'forced', p_force,
    'complete', public._is_group_stage_complete(),
    'qualifying_third_groups', qualifying_key,
    'third_assignments', third_assignments
  );
end;
$$;

revoke all on function public.fill_knockout_r32_from_groups(boolean) from public;
grant execute on function public.fill_knockout_r32_from_groups(boolean) to service_role;

revoke all on function public._annex_c_assignments() from public;
grant execute on function public._annex_c_assignments() to service_role;

-- ─── Auto-actualizar cuadro al marcar partidos como finished ────────────────

create or replace function public.on_match_finished(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ph text;
begin
  select phase into ph from matches where id = p_match_id;
  if ph is null then
    return;
  end if;

  if ph = 'group' then
    perform public.fill_knockout_r32_from_groups(true);
  elsif ph in ('r32', 'r16', 'qf', 'sf') then
    perform public.advance_knockout_from_match(p_match_id);
  end if;
end;
$$;

create or replace function public.on_bracket_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'finished' or new.status != 'finished' then
    return new;
  end if;

  perform public.on_match_finished(new.id);
  return new;
end;
$$;

drop trigger if exists bracket_update_trigger on public.matches;
create trigger bracket_update_trigger
  after update of status on public.matches
  for each row
  execute function public.on_bracket_update();

revoke all on function public.on_match_finished(uuid) from public;
grant execute on function public.on_match_finished(uuid) to service_role;

-- ─── Recalcular cuadro provisional cuando cambia el marcador en vivo ────────

create or replace function public.on_bracket_live_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phase != 'group' or new.status != 'live' then
    return new;
  end if;

  if old.home_score is distinct from new.home_score
     or old.away_score is distinct from new.away_score then
    perform public.fill_knockout_r32_from_groups(true);
  end if;

  return new;
end;
$$;

drop trigger if exists bracket_live_update_trigger on public.matches;
create trigger bracket_live_update_trigger
  after update of home_score, away_score on public.matches
  for each row
  execute function public.on_bracket_live_update();

notify pgrst, 'reload schema';
