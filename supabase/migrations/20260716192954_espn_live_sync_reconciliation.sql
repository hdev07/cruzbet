-- Sincronización ESPN Liga MX basada en snapshots autoritativos.
--
-- Garantías:
-- - Un evento ESPN solo puede existir una vez por partido.
-- - Cada snapshot actualiza eventos existentes y retira los anulados por VAR.
-- - Los eventos manuales nunca se eliminan durante la reconciliación.
-- - El marcador de ESPN es autoritativo y no se infiere contando goles.
-- - Las correcciones posteriores al silbatazo final recalculan la quiniela.

begin;

alter table public.matches
  add column if not exists current_minute integer,
  add column if not exists live_clock_display text,
  add column if not exists live_status_detail text,
  add column if not exists auto_sync_enabled boolean not null default true,
  add column if not exists live_sync_at timestamptz,
  add column if not exists live_sync_error text,
  add column if not exists external_event_id text;

alter table public.match_events
  add column if not exists event_second integer not null default 0,
  add column if not exists source text not null default 'manual',
  add column if not exists external_event_id text,
  add column if not exists source_updated_at timestamptz;

-- Adoptar los eventos creados por el sincronizador anterior.
update public.match_events
set
  source = coalesce(nullif(metadata ->> 'source', ''), source, 'manual'),
  external_event_id = coalesce(
    external_event_id,
    nullif(metadata ->> 'sync_key', '')
  ),
  source_updated_at = coalesce(source_updated_at, created_at, now())
where external_event_id is null
   or source = 'manual';

-- Si el sincronizador antiguo alcanzó a insertar duplicados, conservar el
-- registro más reciente antes de crear la restricción idempotente.
with duplicate_events as (
  select id
  from (
    select
      id,
      row_number() over (
        partition by match_id, source, external_event_id
        order by source_updated_at desc nulls last, created_at desc nulls last, id
      ) as duplicate_number
    from public.match_events
    where source <> 'manual'
      and external_event_id is not null
  ) ranked
  where duplicate_number > 1
)
delete from public.match_events event
using duplicate_events duplicate
where event.id = duplicate.id;

create unique index if not exists match_events_provider_event_uidx
  on public.match_events (match_id, source, external_event_id)
  where external_event_id is not null;

create index if not exists matches_external_event_idx
  on public.matches (external_event_id)
  where external_event_id is not null;

create index if not exists matches_live_sync_window_idx
  on public.matches (competition_id, auto_sync_enabled, match_date)
  where auto_sync_enabled = true;

-- Recalcular siempre, incluso si ESPN corrige el marcador después del final.
create or replace function public.score_base_predictions_for_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_match public.matches%rowtype;
begin
  select *
  into current_match
  from public.matches
  where id = p_match_id;

  if current_match.id is null or current_match.status <> 'finished' then
    return;
  end if;

  update public.base_predictions prediction
  set
    points = public.calculate_base_prediction_points(
      prediction.predicted_winner,
      current_match.home_score,
      current_match.away_score,
      round.points_per_hit
    ),
    scored_at = now(),
    updated_at = now()
  from public.base_quiniela_rounds round
  where prediction.match_id = p_match_id
    and round.id = prediction.round_id;
end;
$$;

create or replace function public.on_match_finished_score_base()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'finished'
     and (
       old.status is distinct from new.status
       or old.home_score is distinct from new.home_score
       or old.away_score is distinct from new.away_score
     ) then
    perform public.score_base_predictions_for_match(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists match_finished_score_base_trigger on public.matches;
create trigger match_finished_score_base_trigger
  after update of status, home_score, away_score
  on public.matches
  for each row
  execute function public.on_match_finished_score_base();

-- Un solo RPC aplica marcador, estado y eventos dentro de la misma transacción.
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

revoke all on function public.apply_espn_snapshot(uuid, jsonb) from public;
revoke all on function public.apply_espn_snapshot(uuid, jsonb) from anon;
revoke all on function public.apply_espn_snapshot(uuid, jsonb) from authenticated;
grant execute on function public.apply_espn_snapshot(uuid, jsonb) to service_role;

revoke all on function public.score_base_predictions_for_match(uuid) from public;
revoke all on function public.score_base_predictions_for_match(uuid) from anon;
revoke all on function public.score_base_predictions_for_match(uuid) from authenticated;
grant execute on function public.score_base_predictions_for_match(uuid) to service_role;

notify pgrst, 'reload schema';

commit;
