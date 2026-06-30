-- Eliminatoria: avanzar ganador/perdedor cuando el partido se define en penales
-- Ejecutar en SQL Editor de Supabase (después de penalty_shootout_migration.sql)

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

-- Reprocesar todos los partidos de eliminatoria con penales definidos
do $$
declare
  mid uuid;
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
  end loop;
end;
$$;

revoke all on function public._match_knockout_winner_team_id(uuid, uuid, integer, integer, integer, integer) from public;
revoke all on function public._match_knockout_loser_team_id(uuid, uuid, integer, integer, integer, integer) from public;
grant execute on function public._match_knockout_winner_team_id(uuid, uuid, integer, integer, integer, integer) to service_role;
grant execute on function public._match_knockout_loser_team_id(uuid, uuid, integer, integer, integer, integer) to service_role;

notify pgrst, 'reload schema';
