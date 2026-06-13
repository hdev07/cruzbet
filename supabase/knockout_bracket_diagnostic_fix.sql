-- Parche: diagnóstico de fase de grupos + fill con mensaje detallado
-- Ejecutar en SQL Editor si fill_knockout_r32_from_groups() devuelve group_stage_incomplete

-- Reemplazar versión anterior sin parámetros
drop function if exists public.fill_knockout_r32_from_groups();
drop function if exists public.fill_knockout_r32_from_groups(boolean);
drop function if exists public.group_stage_diagnostic();

create or replace function public._is_group_stage_complete()
returns boolean
language sql
stable
as $$
  with group_letters as (
    select unnest(array['A','B','C','D','E','F','G','H','I','J','K','L']) as group_name
  ),
  per_group as (
    select
      gl.group_name,
      count(distinct m.id) filter (where m.status = 'finished') as finished_matches
    from group_letters gl
    join teams th on upper(th.group_name) = gl.group_name
    join matches m on m.phase = 'group'
      and th.id in (m.home_team_id, m.away_team_id)
    join teams ta on ta.id = case
      when m.home_team_id = th.id then m.away_team_id
      else m.home_team_id
    end
    and upper(ta.group_name) = gl.group_name
    group by gl.group_name
  )
  select coalesce(bool_and(finished_matches >= 6), false)
  from per_group;
$$;

create or replace function public.group_stage_diagnostic()
returns jsonb
language sql
stable
as $$
  with group_letters as (
    select unnest(array['A','B','C','D','E','F','G','H','I','J','K','L']) as group_name
  ),
  per_group as (
    select
      gl.group_name,
      count(distinct m.id) as total_matches,
      count(distinct m.id) filter (where m.status = 'finished') as finished_matches,
      count(distinct m.id) filter (where m.status = 'live') as live_matches,
      count(distinct m.id) filter (where m.status = 'scheduled') as scheduled_matches
    from group_letters gl
    left join teams th on upper(th.group_name) = gl.group_name
    left join matches m on m.phase = 'group'
      and th.id in (m.home_team_id, m.away_team_id)
    left join teams ta on ta.id = case
      when m.home_team_id = th.id then m.away_team_id
      else m.home_team_id
    end
    and upper(ta.group_name) = gl.group_name
    group by gl.group_name
  ),
  totals as (
    select
      count(*) filter (where phase = 'group') as group_matches_total,
      count(*) filter (where phase = 'group' and status = 'finished') as group_finished_total,
      count(*) filter (where phase = 'r32') as r32_matches_total
    from matches
  )
  select jsonb_build_object(
    'complete', public._is_group_stage_complete(),
    'group_matches_total', t.group_matches_total,
    'group_finished_total', t.group_finished_total,
    'r32_matches_total', t.r32_matches_total,
    'groups', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'group', pg.group_name,
            'finished', pg.finished_matches,
            'needed', 6,
            'pending', greatest(6 - pg.finished_matches, 0),
            'live', pg.live_matches,
            'scheduled', pg.scheduled_matches
          )
          order by pg.group_name
        )
        from per_group pg
      ),
      '[]'::jsonb
    ),
    'hint', case
      when (select r32_matches_total from totals) = 0 then
        'Ejecuta seed_knockout.sql para crear los partidos de eliminatoria.'
      when (select group_matches_total from totals) < 72 then
        'Faltan partidos de fase de grupos en la BD (esperados: 72). Ejecuta seed_group_stage.sql.'
      when not public._is_group_stage_complete() then
        'Marca como finished los partidos de grupo pendientes. Cada grupo necesita 6 partidos finalizados.'
      else
        'Listo: select fill_knockout_r32_from_groups();'
    end
  )
  from totals t;
$$;

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
  assigned_thirds text[] := '{}';
  third_group text;
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

  for m in
    select id, bracket_meta
    from matches
    where phase = 'r32'
    order by (bracket_meta ->> 'match_number')::int
  loop
    home_slot := m.bracket_meta -> 'home';
    away_slot := m.bracket_meta -> 'away';
    home_id := public._resolve_bracket_slot(home_slot, assigned_thirds);
    away_id := public._resolve_bracket_slot(away_slot, assigned_thirds);

    if (home_slot ->> 'type') = 'best_third' and home_id is not null then
      select group_name into third_group from public._ranked_third_places() where team_id = home_id;
      assigned_thirds := array_append(assigned_thirds, third_group);
    end if;
    if (away_slot ->> 'type') = 'best_third' and away_id is not null then
      select group_name into third_group from public._ranked_third_places() where team_id = away_id;
      if not (third_group = any(assigned_thirds)) then
        assigned_thirds := array_append(assigned_thirds, third_group);
      end if;
    end if;

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
    'complete', public._is_group_stage_complete()
  );
end;
$$;

revoke all on function public.fill_knockout_r32_from_groups(boolean) from public;
grant execute on function public.fill_knockout_r32_from_groups(boolean) to service_role;

revoke all on function public.group_stage_diagnostic() from public;
grant execute on function public.group_stage_diagnostic() to service_role;
grant execute on function public.group_stage_diagnostic() to authenticated;
grant execute on function public.group_stage_diagnostic() to anon;

-- Ver qué falta
select public.group_stage_diagnostic();
