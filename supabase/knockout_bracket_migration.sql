-- Árbol de llaves: columnas, auto-llenado desde grupos y avance por ronda
-- Ejecutar en SQL Editor de Supabase

alter table public.matches
  add column if not exists bracket_key text,
  add column if not exists bracket_meta jsonb default '{}'::jsonb;

create unique index if not exists matches_bracket_key_idx
  on public.matches (bracket_key)
  where bracket_key is not null;

-- ─── Utilidades de standings ───────────────────────────────────────────────

create or replace function public._group_team_stats(p_group_name text)
returns table (
  team_id uuid,
  points int,
  goal_diff int,
  goals_for int,
  team_name text
)
language sql
stable
as $$
  with group_teams as (
    select id, name
    from teams
    where upper(group_name) = upper(p_group_name)
  ),
  stats as (
    select
      gt.id as team_id,
      gt.name as team_name,
      coalesce(sum(
        case
          when m.home_team_id = gt.id and m.home_score > m.away_score then 3
          when m.away_team_id = gt.id and m.away_score > m.home_score then 3
          when m.home_score = m.away_score then 1
          else 0
        end
      ), 0)::int as points,
      coalesce(sum(
        case
          when m.home_team_id = gt.id then m.home_score - m.away_score
          when m.away_team_id = gt.id then m.away_score - m.home_score
          else 0
        end
      ), 0)::int as goal_diff,
      coalesce(sum(
        case
          when m.home_team_id = gt.id then m.home_score
          when m.away_team_id = gt.id then m.away_score
          else 0
        end
      ), 0)::int as goals_for
    from group_teams gt
    left join matches m on m.phase = 'group'
      and m.status = 'finished'
      and gt.id in (m.home_team_id, m.away_team_id)
      and m.home_team_id in (select id from group_teams)
      and m.away_team_id in (select id from group_teams)
    group by gt.id, gt.name
  )
  select team_id, points, goal_diff, goals_for, team_name
  from stats
  order by points desc, goal_diff desc, goals_for desc, team_name asc;
$$;

create or replace function public._team_at_group_position(p_group_name text, p_position int)
returns uuid
language sql
stable
as $$
  select team_id
  from (
    select team_id, row_number() over (
      order by points desc, goal_diff desc, goals_for desc, team_name asc
    ) as pos
    from public._group_team_stats(p_group_name)
  ) ranked
  where pos = p_position
  limit 1;
$$;

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
        'Marca como finished los partidos de grupo pendientes (Admin o sync). Cada grupo necesita 6 partidos finalizados.'
      else
        'Listo para llenar dieciseisavos: select fill_knockout_r32_from_groups();'
    end
  )
  from totals t;
$$;

create or replace function public._ranked_third_places()
returns table (
  team_id uuid,
  group_name text,
  points int,
  goal_diff int,
  goals_for int,
  rank int
)
language sql
stable
as $$
  with thirds as (
    select
      g.group_name,
      public._team_at_group_position(g.group_name, 3) as team_id,
      s.points,
      s.goal_diff,
      s.goals_for
    from (select unnest(array['A','B','C','D','E','F','G','H','I','J','K','L']) as group_name) g
    join lateral (
      select points, goal_diff, goals_for
      from public._group_team_stats(g.group_name) st
      where st.team_id = public._team_at_group_position(g.group_name, 3)
    ) s on true
    where public._team_at_group_position(g.group_name, 3) is not null
  )
  select
    team_id,
    group_name,
    points,
    goal_diff,
    goals_for,
    row_number() over (order by points desc, goal_diff desc, goals_for desc, group_name asc)::int as rank
  from thirds;
$$;

create or replace function public._resolve_bracket_slot(p_slot jsonb, p_assigned_thirds text[] default '{}')
returns uuid
language plpgsql
stable
as $$
declare
  slot_type text := p_slot ->> 'type';
  grp text;
  eligible text[];
  picked uuid;
begin
  if slot_type = 'group_pos' then
    return public._team_at_group_position(p_slot ->> 'group', (p_slot ->> 'pos')::int);
  end if;

  if slot_type = 'best_third' then
    eligible := array(select jsonb_array_elements_text(p_slot -> 'groups'));
    select rt.team_id into picked
    from public._ranked_third_places() rt
    where rt.rank <= 8
      and rt.group_name = any(eligible)
      and not (rt.group_name = any(p_assigned_thirds))
    order by rt.rank
    limit 1;
    return picked;
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

-- ─── Llenar dieciseisavos desde grupos ─────────────────────────────────────

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

-- ─── Avanzar ganador/perdedor a la siguiente ronda ─────────────────────────

create or replace function public.advance_knockout_from_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  src record;
  tgt record;
  winner uuid;
  loser uuid;
  side text;
  slot jsonb;
  team_id uuid;
  updated_count int := 0;
  src_num int;
begin
  select * into src from matches where id = p_match_id;
  if src is null or src.status != 'finished' or src.bracket_key is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_source');
  end if;

  if src.home_score = src.away_score then
    return jsonb_build_object('ok', false, 'reason', 'draw_not_supported');
  end if;

  if src.home_score > src.away_score then
    winner := src.home_team_id;
    loser := src.away_team_id;
  else
    winner := src.away_team_id;
    loser := src.home_team_id;
  end if;

  src_num := (src.bracket_meta ->> 'match_number')::int;

  for tgt in
    select id, bracket_meta
    from matches
    where bracket_meta is not null
      and phase in ('r32', 'r16', 'qf', 'sf', 'third', 'final')
      and id != p_match_id
  loop
    foreach side in array array['home', 'away']
    loop
      slot := tgt.bracket_meta -> side;
      if slot is null then
        continue;
      end if;

      team_id := null;
      if (slot ->> 'type') = 'winner' and (slot ->> 'match')::int = src_num then
        team_id := winner;
      elsif (slot ->> 'type') = 'loser' and (slot ->> 'match')::int = src_num then
        team_id := loser;
      end if;

      if team_id is not null then
        if side = 'home' then
          update matches set home_team_id = team_id where id = tgt.id and home_team_id is distinct from team_id;
        else
          update matches set away_team_id = team_id where id = tgt.id and away_team_id is distinct from team_id;
        end if;
        if found then
          updated_count := updated_count + 1;
        end if;
      end if;
    end loop;
  end loop;

  return jsonb_build_object('ok', true, 'updated', updated_count, 'from', src.bracket_key);
end;
$$;

create or replace function public.on_bracket_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if old.status = 'finished' or new.status != 'finished' then
    return new;
  end if;

  if new.phase = 'group' then
    perform public.fill_knockout_r32_from_groups();
  elsif new.phase in ('r32', 'r16', 'qf', 'sf') then
    result := public.advance_knockout_from_match(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists bracket_update_trigger on public.matches;
create trigger bracket_update_trigger
  after update of status on public.matches
  for each row execute function public.on_bracket_update();

revoke all on function public.fill_knockout_r32_from_groups(boolean) from public;
grant execute on function public.fill_knockout_r32_from_groups(boolean) to service_role;

revoke all on function public.group_stage_diagnostic() from public;
grant execute on function public.group_stage_diagnostic() to service_role;
grant execute on function public.group_stage_diagnostic() to authenticated;
grant execute on function public.group_stage_diagnostic() to anon;

revoke all on function public.advance_knockout_from_match(uuid) from public;
grant execute on function public.advance_knockout_from_match(uuid) to service_role;

-- Diagnóstico (no es error si la fase de grupos sigue en curso)
select public.group_stage_diagnostic();
