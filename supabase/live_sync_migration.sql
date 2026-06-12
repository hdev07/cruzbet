-- Sincronización automática en vivo (cron → apply_live_sync)
-- Ejecutar en SQL Editor de Supabase

alter table matches
  add column if not exists auto_sync_enabled boolean not null default true,
  add column if not exists live_sync_at timestamptz,
  add column if not exists live_sync_error text,
  add column if not exists external_event_id text;

create index if not exists matches_auto_sync_idx
  on matches (auto_sync_enabled, status, match_date)
  where auto_sync_enabled = true;

-- Aplica datos en vivo desde el cron (service role vía RPC)
create or replace function public.apply_live_sync(
  p_match_id uuid,
  p_status text,
  p_current_minute integer,
  p_home_score integer,
  p_away_score integer,
  p_goals jsonb default '[]'::jsonb,
  p_external_event_id text default null
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
  new_status match_status;
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

  if new_status = 'live' and m.status = 'scheduled' then
    update matches
    set status = 'live',
        current_minute = greatest(coalesce(p_current_minute, 0), 0),
        home_score = coalesce(p_home_score, 0),
        away_score = coalesce(p_away_score, 0),
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'live' then
    update matches
    set current_minute = greatest(coalesce(current_minute, 0), coalesce(p_current_minute, 0)),
        home_score = coalesce(p_home_score, home_score),
        away_score = coalesce(p_away_score, away_score),
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  elsif new_status = 'finished' then
    update matches
    set current_minute = greatest(coalesce(current_minute, 0), coalesce(p_current_minute, 0)),
        home_score = coalesce(p_home_score, home_score),
        away_score = coalesce(p_away_score, away_score),
        external_event_id = coalesce(p_external_event_id, external_event_id),
        live_sync_at = now(),
        live_sync_error = null
    where id = p_match_id;
  end if;

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
          'type', 'foot',
          'sync_key', g ->> 'sync_key',
          'player', g ->> 'player',
          'source', coalesce(g ->> 'source', 'live_sync')
        )
      );
      inserted_goals := inserted_goals + 1;
    end if;
  end loop;

  perform public.sync_match_score_from_goals(p_match_id);

  if new_status = 'finished' and m.status != 'finished' then
    update matches set status = 'finished' where id = p_match_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', new_status,
    'goals_inserted', inserted_goals
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

revoke all on function public.apply_live_sync(uuid, text, integer, integer, integer, jsonb, text) from public;
grant execute on function public.apply_live_sync(uuid, text, integer, integer, integer, jsonb, text) to service_role;

notify pgrst, 'reload schema';
