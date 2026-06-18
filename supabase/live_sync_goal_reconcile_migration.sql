-- Reconcilia goles auto-sync con ESPN: elimina anulados y corrige marcador
-- Ejecutar en SQL Editor de Supabase

create or replace function public.apply_live_sync(
  p_match_id uuid,
  p_status text,
  p_current_minute integer,
  p_home_score integer,
  p_away_score integer,
  p_goals jsonb default '[]'::jsonb,
  p_external_event_id text default null,
  p_live_clock_display text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  g jsonb;
  home_id uuid;
  away_id uuid;
  team_id uuid;
  inserted_goals integer := 0;
  removed_goals integer := 0;
  new_status match_status;
  next_minute integer;
  next_clock text;
  incoming_sync_keys text[];
  h_score integer;
  a_score integer;
  excess_id uuid;
begin
  select * into m from matches where id = p_match_id for update;
  if m is null then
    return jsonb_build_object('ok', false, 'error', 'match_not_found');
  end if;

  if not m.auto_sync_enabled then
    return jsonb_build_object('ok', false, 'error', 'auto_sync_disabled');
  end if;

  if m.status = 'finished' then
    return jsonb_build_object('ok', true, 'skipped', 'already_finished');
  end if;

  new_status := p_status::match_status;
  home_id := m.home_team_id;
  away_id := m.away_team_id;

  next_minute := case
    when p_live_clock_display = 'HT' then 45
    else greatest(coalesce(m.current_minute, 0), coalesce(p_current_minute, 0))
  end;

  next_clock := case
    when p_live_clock_display is null then m.live_clock_display
    when p_live_clock_display = 'HT' or p_live_clock_display = 'FT' then p_live_clock_display
    when coalesce(p_current_minute, 0) < coalesce(m.current_minute, 0)
         and coalesce(m.current_minute, 0) > 0 then m.live_clock_display
    else p_live_clock_display
  end;

  if new_status = 'live' and m.status = 'scheduled' then
    update matches
    set status = 'live',
        current_minute = next_minute,
        live_clock_display = next_clock,
        home_score = coalesce(p_home_score, 0),
        away_score = coalesce(p_away_score, 0),
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'live' then
    update matches
    set current_minute = next_minute,
        live_clock_display = next_clock,
        home_score = coalesce(p_home_score, home_score),
        away_score = coalesce(p_away_score, away_score),
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'finished' then
    update matches
    set current_minute = next_minute,
        live_clock_display = coalesce(next_clock, 'FT'),
        home_score = coalesce(p_home_score, home_score),
        away_score = coalesce(p_away_score, away_score),
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  end if;

  select coalesce(array_agg(distinct g ->> 'sync_key'), '{}'::text[])
  into incoming_sync_keys
  from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb)) g
  where g ->> 'sync_key' is not null;

  for g in select * from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb))
  loop
    if not exists (
      select 1 from match_events
      where match_id = p_match_id
        and event_type = 'goal'
        and metadata ->> 'sync_key' = g ->> 'sync_key'
    ) then
      team_id := case
        when g ->> 'team_side' = 'home' then home_id
        else away_id
      end;

      insert into match_events (
        match_id,
        team_id,
        event_type,
        minute,
        extra_time,
        event_second,
        metadata
      ) values (
        p_match_id,
        team_id,
        'goal',
        coalesce((g ->> 'minute')::integer, 1),
        coalesce((g ->> 'extra_time')::integer, 0),
        coalesce((g ->> 'event_second')::integer, 0),
        jsonb_build_object(
          'type', coalesce(g ->> 'goal_type', 'foot'),
          'sync_key', g ->> 'sync_key',
          'player', g ->> 'player',
          'source', coalesce(g ->> 'source', 'live_sync')
        )
      );
      inserted_goals := inserted_goals + 1;
    end if;
  end loop;

  -- Quitar goles auto-sync que ESPN ya no reporta (VAR, fuera de lugar, etc.)
  delete from match_events me
  where me.match_id = p_match_id
    and me.event_type = 'goal'
    and me.metadata ->> 'sync_key' is not null
    and coalesce(me.metadata ->> 'source', '') in ('espn', 'google', 'live_sync')
    and not (me.metadata ->> 'sync_key' = any(incoming_sync_keys));
  GET DIAGNOSTICS removed_goals = ROW_COUNT;

  perform public.sync_match_score_from_goals(p_match_id);

  -- Si el marcador por goles no coincide con ESPN, eliminar excedentes auto-sync
  loop
    select home_score, away_score into h_score, a_score
    from matches where id = p_match_id;

    exit when h_score = p_home_score and a_score = p_away_score;

    if h_score > p_home_score then
      select me.id into excess_id
      from match_events me
      where me.match_id = p_match_id
        and me.event_type = 'goal'
        and me.team_id = home_id
        and me.metadata ->> 'sync_key' is not null
      order by me.minute desc, me.extra_time desc, me.created_at desc
      limit 1;
    elsif a_score > p_away_score then
      select me.id into excess_id
      from match_events me
      where me.match_id = p_match_id
        and me.event_type = 'goal'
        and me.team_id = away_id
        and me.metadata ->> 'sync_key' is not null
      order by me.minute desc, me.extra_time desc, me.created_at desc
      limit 1;
    else
      update matches
      set home_score = p_home_score,
          away_score = p_away_score
      where id = p_match_id;
      exit;
    end if;

    if excess_id is null then
      update matches
      set home_score = p_home_score,
          away_score = p_away_score
      where id = p_match_id;
      exit;
    end if;

    delete from match_events where id = excess_id;
    removed_goals := removed_goals + 1;
    excess_id := null;
    perform public.sync_match_score_from_goals(p_match_id);
  end loop;

  if new_status = 'finished' and m.status != 'finished' then
    update matches set status = 'finished' where id = p_match_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', new_status,
    'goals_inserted', inserted_goals,
    'goals_removed', removed_goals
  );
exception
  when others then
    update matches
    set live_sync_error = SQLERRM,
        live_sync_at = now()
    where id = p_match_id;
    return jsonb_build_object('ok', false, 'error', SQLERRM);
end;
$$;

revoke all on function public.apply_live_sync(uuid, text, integer, integer, integer, jsonb, text, text) from public;
grant execute on function public.apply_live_sync(uuid, text, integer, integer, integer, jsonb, text, text) to service_role;

notify pgrst, 'reload schema';
