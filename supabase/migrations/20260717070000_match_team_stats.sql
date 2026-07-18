-- Estadísticas de equipo por partido (posesión, tiros, córners, faltas, pases,
-- entradas, intercepciones, despejes), tomadas del boxscore de ESPN.
-- Alimenta las gráficas del perfil de equipo y el detalle de partido.

begin;

create table if not exists public.match_team_stats (
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  possession_pct numeric,
  shots_total integer,
  shots_on_target integer,
  corners integer,
  fouls integer,
  saves integer,
  passes_total integer,
  passes_accurate integer,
  tackles_total integer,
  tackles_won integer,
  interceptions integer,
  clearances integer,
  crosses_total integer,
  crosses_accurate integer,
  synced_at timestamptz not null default now(),
  primary key (match_id, team_id)
);

create index if not exists match_team_stats_team_idx
  on public.match_team_stats (team_id);

alter table public.match_team_stats enable row level security;

drop policy if exists "match_team_stats_public_read" on public.match_team_stats;
create policy "match_team_stats_public_read"
  on public.match_team_stats
  for select
  to anon, authenticated
  using (true);

grant select on public.match_team_stats to anon, authenticated;

-- El RPC existente que aplica snapshots ESPN también persiste el boxscore
-- por equipo cuando el snapshot lo incluye (campo "team_stats").
create or replace function public.apply_espn_snapshot(
  p_match_id uuid,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_match public.matches%rowtype;
  incoming_status public.match_status;
  next_status public.match_status;
  incoming_home_score integer;
  incoming_away_score integer;
  incoming_minute integer;
  incoming_event_ids text[];
  event_item jsonb;
  event_team_id uuid;
  event_kind public.event_type;
  inserted_or_updated integer := 0;
  removed_events integer := 0;
  stats_item jsonb;
  stats_team_id uuid;
begin
  if coalesce(p_snapshot ->> 'provider', '') <> 'espn' then
    return jsonb_build_object('ok', false, 'error', 'invalid_provider');
  end if;

  select *
  into current_match
  from public.matches
  where id = p_match_id
  for update;

  if current_match.id is null then
    return jsonb_build_object('ok', false, 'error', 'match_not_found');
  end if;

  if not current_match.auto_sync_enabled then
    return jsonb_build_object('ok', true, 'skipped', 'auto_sync_disabled');
  end if;

  incoming_status := coalesce(
    nullif(p_snapshot ->> 'status', '')::public.match_status,
    current_match.status
  );
  incoming_home_score := coalesce(
    nullif(p_snapshot ->> 'home_score', '')::integer,
    current_match.home_score,
    0
  );
  incoming_away_score := coalesce(
    nullif(p_snapshot ->> 'away_score', '')::integer,
    current_match.away_score,
    0
  );
  incoming_minute := nullif(p_snapshot ->> 'current_minute', '')::integer;

  -- El estado nunca retrocede por una respuesta temporalmente obsoleta.
  next_status := case
    when current_match.status = 'finished' then 'finished'::public.match_status
    when incoming_status = 'finished' then 'finished'::public.match_status
    when current_match.status = 'live' then 'live'::public.match_status
    else incoming_status
  end;

  update public.matches
  set
    status = next_status,
    match_date = case
      when current_match.status = 'scheduled'
       and incoming_status = 'scheduled'
       and nullif(p_snapshot ->> 'scheduled_at', '') is not null
      then (p_snapshot ->> 'scheduled_at')::timestamptz
      else match_date
    end,
    current_minute = case
      when next_status = 'scheduled' then current_minute
      when next_status = 'finished' then greatest(
        coalesce(current_minute, 0),
        coalesce(incoming_minute, 90)
      )
      else greatest(coalesce(current_minute, 0), coalesce(incoming_minute, 0))
    end,
    live_clock_display = case
      when next_status = 'finished' then 'FT'
      else coalesce(nullif(p_snapshot ->> 'clock', ''), live_clock_display)
    end,
    live_status_detail = case
      when next_status = 'finished' then null
      else nullif(p_snapshot ->> 'status_detail', '')
    end,
    home_score = incoming_home_score,
    away_score = incoming_away_score,
    external_event_id = coalesce(
      nullif(p_snapshot ->> 'external_event_id', ''),
      external_event_id
    ),
    live_sync_at = now(),
    live_sync_error = null
  where id = p_match_id;

  if coalesce((p_snapshot ->> 'events_complete')::boolean, false) then
    select coalesce(
      array_agg(distinct item ->> 'external_event_id')
        filter (where nullif(item ->> 'external_event_id', '') is not null),
      '{}'::text[]
    )
    into incoming_event_ids
    from jsonb_array_elements(
      coalesce(p_snapshot -> 'events', '[]'::jsonb)
    ) item;

    for event_item in
      select *
      from jsonb_array_elements(
        coalesce(p_snapshot -> 'events', '[]'::jsonb)
      )
    loop
      if nullif(event_item ->> 'external_event_id', '') is null then
        continue;
      end if;

      event_kind := (event_item ->> 'event_type')::public.event_type;
      event_team_id := case event_item ->> 'team_side'
        when 'home' then current_match.home_team_id
        when 'away' then current_match.away_team_id
        else null
      end;

      insert into public.match_events (
        match_id,
        team_id,
        event_type,
        minute,
        extra_time,
        event_second,
        metadata,
        source,
        external_event_id,
        source_updated_at
      ) values (
        p_match_id,
        event_team_id,
        event_kind,
        greatest(coalesce((event_item ->> 'minute')::integer, 0), 0),
        greatest(coalesce((event_item ->> 'extra_time')::integer, 0), 0),
        greatest(coalesce((event_item ->> 'event_second')::integer, 0), 0),
        coalesce(event_item -> 'metadata', '{}'::jsonb)
          || jsonb_build_object(
            'source', 'espn',
            'sync_key', 'espn:' || (event_item ->> 'external_event_id')
          ),
        'espn',
        event_item ->> 'external_event_id',
        now()
      )
      on conflict (match_id, source, external_event_id)
        where external_event_id is not null
      do update
      set
        team_id = excluded.team_id,
        event_type = excluded.event_type,
        minute = excluded.minute,
        extra_time = excluded.extra_time,
        event_second = excluded.event_second,
        metadata = excluded.metadata,
        source_updated_at = excluded.source_updated_at;

      inserted_or_updated := inserted_or_updated + 1;
    end loop;

    -- Un evento ESPN ausente del snapshot completo fue anulado o corregido.
    -- Los eventos manuales y de otros proveedores quedan intactos.
    delete from public.match_events event
    where event.match_id = p_match_id
      and event.source = 'espn'
      and event.external_event_id is not null
      and not (event.external_event_id = any(incoming_event_ids));

    get diagnostics removed_events = row_count;
  end if;

  for stats_item in
    select *
    from jsonb_array_elements(
      coalesce(p_snapshot -> 'team_stats', '[]'::jsonb)
    )
  loop
    stats_team_id := case stats_item ->> 'team_side'
      when 'home' then current_match.home_team_id
      when 'away' then current_match.away_team_id
      else null
    end;

    if stats_team_id is null then
      continue;
    end if;

    insert into public.match_team_stats (
      match_id,
      team_id,
      possession_pct,
      shots_total,
      shots_on_target,
      corners,
      fouls,
      saves,
      passes_total,
      passes_accurate,
      tackles_total,
      tackles_won,
      interceptions,
      clearances,
      crosses_total,
      crosses_accurate,
      synced_at
    ) values (
      p_match_id,
      stats_team_id,
      nullif(stats_item ->> 'possession_pct', '')::numeric,
      nullif(stats_item ->> 'shots_total', '')::integer,
      nullif(stats_item ->> 'shots_on_target', '')::integer,
      nullif(stats_item ->> 'corners', '')::integer,
      nullif(stats_item ->> 'fouls', '')::integer,
      nullif(stats_item ->> 'saves', '')::integer,
      nullif(stats_item ->> 'passes_total', '')::integer,
      nullif(stats_item ->> 'passes_accurate', '')::integer,
      nullif(stats_item ->> 'tackles_total', '')::integer,
      nullif(stats_item ->> 'tackles_won', '')::integer,
      nullif(stats_item ->> 'interceptions', '')::integer,
      nullif(stats_item ->> 'clearances', '')::integer,
      nullif(stats_item ->> 'crosses_total', '')::integer,
      nullif(stats_item ->> 'crosses_accurate', '')::integer,
      now()
    )
    on conflict (match_id, team_id)
    do update
    set
      possession_pct = excluded.possession_pct,
      shots_total = excluded.shots_total,
      shots_on_target = excluded.shots_on_target,
      corners = excluded.corners,
      fouls = excluded.fouls,
      saves = excluded.saves,
      passes_total = excluded.passes_total,
      passes_accurate = excluded.passes_accurate,
      tackles_total = excluded.tackles_total,
      tackles_won = excluded.tackles_won,
      interceptions = excluded.interceptions,
      clearances = excluded.clearances,
      crosses_total = excluded.crosses_total,
      crosses_accurate = excluded.crosses_accurate,
      synced_at = excluded.synced_at;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'status', next_status,
    'events_reconciled', inserted_or_updated,
    'events_removed', removed_events,
    'events_complete', coalesce(
      (p_snapshot ->> 'events_complete')::boolean,
      false
    )
  );
exception
  when others then
    update public.matches
    set
      live_sync_error = sqlerrm,
      live_sync_at = now()
    where id = p_match_id;

    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

notify pgrst, 'reload schema';

commit;
