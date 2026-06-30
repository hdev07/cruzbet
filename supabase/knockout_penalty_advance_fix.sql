-- Fix: ganadores en penales no avanzan en el cuadro
-- Causa: el partido se marcaba finished antes de llegar los penales; el sync los ignoraba
--        y no había trigger al guardar penales después.
-- Ejecutar en SQL Editor de Supabase (después de penalty_shootout_migration.sql
-- y knockout_penalty_winner_migration.sql si ya lo corriste).

create or replace function public._match_knockout_winner_team_id(
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_home_score integer,
  p_away_score integer,
  p_penalty_home_score integer,
  p_penalty_away_score integer
)
returns uuid
language sql
immutable
as $$
  select case
    when p_penalty_home_score is not null
         and p_penalty_away_score is not null
         and p_penalty_home_score <> p_penalty_away_score
         and p_penalty_home_score > p_penalty_away_score then p_home_team_id
    when p_penalty_home_score is not null
         and p_penalty_away_score is not null
         and p_penalty_home_score <> p_penalty_away_score
         and p_penalty_away_score > p_penalty_home_score then p_away_team_id
    when p_home_score > p_away_score then p_home_team_id
    when p_away_score > p_home_score then p_away_team_id
    else null
  end;
$$;

create or replace function public._match_knockout_loser_team_id(
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_home_score integer,
  p_away_score integer,
  p_penalty_home_score integer,
  p_penalty_away_score integer
)
returns uuid
language sql
immutable
as $$
  select case
    when public._match_knockout_winner_team_id(
      p_home_team_id, p_away_team_id,
      p_home_score, p_away_score,
      p_penalty_home_score, p_penalty_away_score
    ) = p_home_team_id then p_away_team_id
    when public._match_knockout_winner_team_id(
      p_home_team_id, p_away_team_id,
      p_home_score, p_away_score,
      p_penalty_home_score, p_penalty_away_score
    ) = p_away_team_id then p_home_team_id
    else null
  end;
$$;

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

  winner := public._match_knockout_winner_team_id(
    src.home_team_id, src.away_team_id,
    src.home_score, src.away_score,
    src.penalty_home_score, src.penalty_away_score
  );

  if winner is null then
    return jsonb_build_object('ok', false, 'reason', 'draw_not_supported');
  end if;

  if winner = src.home_team_id then
    loser := src.away_team_id;
  else
    loser := src.home_team_id;
  end if;

  src_num := coalesce(
    (src.bracket_meta ->> 'match_number')::int,
    nullif(regexp_replace(src.bracket_key, '\D', '', 'g'), '')::int
  );

  if src_num is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_match_number');
  end if;

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

create or replace function public._resolve_bracket_slot(
  p_slot jsonb,
  p_opponent_slot jsonb default null,
  p_third_assignments jsonb default null
)
returns uuid
language plpgsql
stable
set search_path = public
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
    select public._match_knockout_winner_team_id(
      m.home_team_id, m.away_team_id,
      m.home_score, m.away_score,
      m.penalty_home_score, m.penalty_away_score
    ) into picked
    from matches m
    where m.bracket_key = 'M' || (p_slot ->> 'match')
      and m.status = 'finished';
    return picked;
  end if;

  if slot_type = 'loser' then
    select public._match_knockout_loser_team_id(
      m.home_team_id, m.away_team_id,
      m.home_score, m.away_score,
      m.penalty_home_score, m.penalty_away_score
    ) into picked
    from matches m
    where m.bracket_key = 'M' || (p_slot ->> 'match')
      and m.status = 'finished';
    return picked;
  end if;

  return null;
end;
$$;

-- Avanzar cuadro cuando se guardan penales en un partido ya finalizado
create or replace function public.on_knockout_penalty_scores_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status != 'finished' then
    return new;
  end if;

  if new.bracket_key is null or new.phase not in ('r32', 'r16', 'qf', 'sf') then
    return new;
  end if;

  if new.penalty_home_score is null
     or new.penalty_away_score is null
     or new.penalty_home_score = new.penalty_away_score then
    return new;
  end if;

  if old.penalty_home_score is not distinct from new.penalty_home_score
     and old.penalty_away_score is not distinct from new.penalty_away_score then
    return new;
  end if;

  perform public.advance_knockout_from_match(new.id);
  return new;
end;
$$;

drop trigger if exists knockout_penalty_advance_trigger on public.matches;
create trigger knockout_penalty_advance_trigger
  after update of penalty_home_score, penalty_away_score on public.matches
  for each row
  execute function public.on_knockout_penalty_scores_updated();

-- apply_live_sync: permitir parchear penales en partidos ya finished
create or replace function public.apply_live_sync(
  p_match_id uuid,
  p_status text,
  p_current_minute integer,
  p_home_score integer,
  p_away_score integer,
  p_goals jsonb default '[]'::jsonb,
  p_external_event_id text default null,
  p_live_clock_display text default null,
  p_cards jsonb default '[]'::jsonb,
  p_live_status_detail text default null,
  p_penalty_home_score integer default null,
  p_penalty_away_score integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  goal_item jsonb;
  card_item jsonb;
  home_id uuid;
  away_id uuid;
  team_id uuid;
  inserted_goals integer := 0;
  removed_goals integer := 0;
  inserted_cards integer := 0;
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
    if p_penalty_home_score is not null
       and p_penalty_away_score is not null
       and p_penalty_home_score <> p_penalty_away_score
       and (m.penalty_home_score is distinct from p_penalty_home_score
            or m.penalty_away_score is distinct from p_penalty_away_score) then
      update matches
      set penalty_home_score = p_penalty_home_score,
          penalty_away_score = p_penalty_away_score,
          home_score = coalesce(p_home_score, home_score),
          away_score = coalesce(p_away_score, away_score),
          external_event_id = coalesce(p_external_event_id, external_event_id),
          live_sync_at = now(),
          live_sync_error = null
      where id = p_match_id;
      return jsonb_build_object('ok', true, 'patched_finished_penalties', true);
    end if;
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
        live_status_detail = p_live_status_detail,
        home_score = coalesce(p_home_score, 0),
        away_score = coalesce(p_away_score, 0),
        penalty_home_score = case when p_penalty_home_score is not null then p_penalty_home_score else penalty_home_score end,
        penalty_away_score = case when p_penalty_away_score is not null then p_penalty_away_score else penalty_away_score end,
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'live' then
    update matches
    set current_minute = next_minute,
        live_clock_display = next_clock,
        live_status_detail = p_live_status_detail,
        home_score = coalesce(p_home_score, home_score),
        away_score = coalesce(p_away_score, away_score),
        penalty_home_score = case when p_penalty_home_score is not null then p_penalty_home_score else penalty_home_score end,
        penalty_away_score = case when p_penalty_away_score is not null then p_penalty_away_score else penalty_away_score end,
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'finished' then
    update matches
    set current_minute = next_minute,
        live_clock_display = coalesce(next_clock, 'FT'),
        live_status_detail = null,
        home_score = coalesce(p_home_score, home_score),
        away_score = coalesce(p_away_score, away_score),
        penalty_home_score = case when p_penalty_home_score is not null then p_penalty_home_score else penalty_home_score end,
        penalty_away_score = case when p_penalty_away_score is not null then p_penalty_away_score else penalty_away_score end,
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'scheduled' then
    update matches
    set live_status_detail = p_live_status_detail,
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  end if;

  select coalesce(array_agg(distinct goal_row ->> 'sync_key'), '{}'::text[])
  into incoming_sync_keys
  from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb)) goal_row
  where goal_row ->> 'sync_key' is not null;

  for goal_item in select * from jsonb_array_elements(coalesce(p_goals, '[]'::jsonb))
  loop
    if not exists (
      select 1 from match_events
      where match_id = p_match_id
        and event_type = 'goal'
        and metadata ->> 'sync_key' = goal_item ->> 'sync_key'
    ) then
      team_id := case
        when goal_item ->> 'team_side' = 'home' then home_id
        else away_id
      end;

      insert into match_events (
        match_id, team_id, event_type, minute, extra_time, event_second, metadata
      ) values (
        p_match_id,
        team_id,
        'goal',
        coalesce((goal_item ->> 'minute')::integer, 1),
        coalesce((goal_item ->> 'extra_time')::integer, 0),
        coalesce((goal_item ->> 'event_second')::integer, 0),
        jsonb_build_object(
          'type', coalesce(goal_item ->> 'goal_type', 'foot'),
          'sync_key', goal_item ->> 'sync_key',
          'player', goal_item ->> 'player',
          'source', coalesce(goal_item ->> 'source', 'live_sync')
        )
      );
      inserted_goals := inserted_goals + 1;
    end if;
  end loop;

  delete from match_events me
  where me.match_id = p_match_id
    and me.event_type = 'goal'
    and me.metadata ->> 'sync_key' is not null
    and coalesce(me.metadata ->> 'source', '') in ('espn', 'google', 'live_sync')
    and not (me.metadata ->> 'sync_key' = any(incoming_sync_keys));
  GET DIAGNOSTICS removed_goals = ROW_COUNT;

  for card_item in select * from jsonb_array_elements(coalesce(p_cards, '[]'::jsonb))
  loop
    if not exists (
      select 1 from match_events
      where match_id = p_match_id
        and event_type = 'card'
        and metadata ->> 'sync_key' = card_item ->> 'sync_key'
    ) then
      team_id := case
        when card_item ->> 'team_side' = 'home' then home_id
        else away_id
      end;

      insert into match_events (
        match_id, team_id, event_type, minute, extra_time, event_second, metadata
      ) values (
        p_match_id,
        team_id,
        'card',
        coalesce((card_item ->> 'minute')::integer, 1),
        coalesce((card_item ->> 'extra_time')::integer, 0),
        coalesce((card_item ->> 'event_second')::integer, 0),
        jsonb_build_object(
          'card_type', coalesce(card_item ->> 'card_type', 'yellow'),
          'sync_key', card_item ->> 'sync_key',
          'player', card_item ->> 'player',
          'source', coalesce(card_item ->> 'source', 'live_sync')
        )
      );
      inserted_cards := inserted_cards + 1;
    end if;
  end loop;

  perform public.sync_match_score_from_goals(p_match_id);

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
    'goals_removed', removed_goals,
    'cards_inserted', inserted_cards
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

-- Reprocesar todos los partidos de eliminatoria con penales definidos
do $$
declare
  mid uuid;
  total int := 0;
begin
  for mid in
    select m.id
    from matches m
    where m.status = 'finished'
      and m.bracket_key is not null
      and m.phase in ('r32', 'r16', 'qf', 'sf')
      and m.penalty_home_score is not null
      and m.penalty_away_score is not null
      and m.penalty_home_score <> m.penalty_away_score
  loop
    perform public.advance_knockout_from_match(mid);
    total := total + 1;
  end loop;
  raise notice 'Reprocesados % partidos con penales', total;
end;
$$;

revoke all on function public.apply_live_sync(uuid, text, integer, integer, integer, jsonb, text, text, jsonb, text, integer, integer) from public;
grant execute on function public.apply_live_sync(uuid, text, integer, integer, integer, jsonb, text, text, jsonb, text, integer, integer) to service_role;

notify pgrst, 'reload schema';
