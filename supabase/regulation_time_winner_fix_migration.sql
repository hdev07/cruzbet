-- Fix: finalizar partido fallaba (400) por UPDATE anidado en trigger AFTER UPDATE
-- Ejecutar en SQL Editor de Supabase (después de regulation_time_winner_migration.sql)

alter table public.matches
  add column if not exists regulation_home_score integer,
  add column if not exists regulation_away_score integer;

create or replace function public.is_regulation_time_goal(p_minute integer)
returns boolean
language sql
immutable
as $$
  select p_minute <= 90;
$$;

create or replace function public.compute_regulation_scores(p_match_id uuid)
returns table(reg_home integer, reg_away integer)
language plpgsql
stable
set search_path = public
as $$
declare
  home_id uuid;
  h integer;
  a integer;
begin
  select m.home_team_id into home_id from matches m where m.id = p_match_id;

  if home_id is null then
    reg_home := 0;
    reg_away := 0;
    return next;
  end if;

  select
    count(*) filter (where team_id = home_id),
    count(*) filter (where team_id is distinct from home_id)
  into h, a
  from match_events
  where match_id = p_match_id
    and event_type = 'goal'
    and is_regulation_time_goal(minute);

  if coalesce(h, 0) + coalesce(a, 0) > 0 then
    reg_home := coalesce(h, 0);
    reg_away := coalesce(a, 0);
    return next;
  end if;

  select m.home_score, m.away_score into reg_home, reg_away
  from matches m
  where m.id = p_match_id;

  reg_home := coalesce(reg_home, 0);
  reg_away := coalesce(reg_away, 0);
  return next;
end;
$$;

-- Escribe marcador reglamentario en la misma fila (sin UPDATE anidado)
create or replace function public.set_regulation_scores_before_finish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  if old.status = 'finished' or new.status != 'finished' then
    return new;
  end if;

  select r.reg_home, r.reg_away
  into s
  from compute_regulation_scores(new.id) as r;

  new.regulation_home_score := s.reg_home;
  new.regulation_away_score := s.reg_away;
  return new;
end;
$$;

drop trigger if exists match_set_regulation_scores_trigger on public.matches;
create trigger match_set_regulation_scores_trigger
  before update on public.matches
  for each row execute function public.set_regulation_scores_before_finish();

create or replace function public.sync_match_regulation_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
begin
  select r.reg_home, r.reg_away
  into s
  from compute_regulation_scores(p_match_id) as r;

  update matches
  set
    regulation_home_score = s.reg_home,
    regulation_away_score = s.reg_away
  where id = p_match_id;
end;
$$;

create or replace function public.rescore_winner_predictions_for_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  m record;
  new_pts integer;
  delta integer;
begin
  perform sync_match_regulation_scores(p_match_id);

  select regulation_home_score, regulation_away_score
  into m
  from matches
  where id = p_match_id;

  for pred in
    select * from predictions
    where match_id = p_match_id
      and prediction_type = 'score'
      and scored_at is not null
  loop
    new_pts := calculate_winner_prediction_points(
      pred.predicted_winner,
      m.regulation_home_score,
      m.regulation_away_score
    );
    delta := new_pts - coalesce(pred.score_points, 0);

    if delta <> 0 then
      update predictions set score_points = new_pts where id = pred.id;
      update profiles set points = greatest(0, points + delta) where id = pred.user_id;
    end if;
  end loop;

  for pred in
    select bp.*, r.points_per_hit
    from base_predictions bp
    join base_quiniela_rounds r on r.id = bp.round_id
    where bp.match_id = p_match_id
      and bp.scored_at is not null
  loop
    new_pts := calculate_base_prediction_points(
      pred.predicted_winner,
      m.regulation_home_score,
      m.regulation_away_score,
      pred.points_per_hit
    );
    delta := new_pts - coalesce(pred.points, 0);

    if delta <> 0 then
      update base_predictions set points = new_pts where id = pred.id;
    end if;
  end loop;
end;
$$;

create or replace function public.score_base_predictions_for_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  m record;
  s record;
  pts integer;
begin
  select regulation_home_score, regulation_away_score, status
  into m
  from matches
  where id = p_match_id;

  if m.status != 'finished' then
    return;
  end if;

  if m.regulation_home_score is null or m.regulation_away_score is null then
    select r.reg_home, r.reg_away into s from compute_regulation_scores(p_match_id) as r;
    m.regulation_home_score := s.reg_home;
    m.regulation_away_score := s.reg_away;
  end if;

  for pred in
    select bp.*, r.points_per_hit
    from base_predictions bp
    join base_quiniela_rounds r on r.id = bp.round_id
    where bp.match_id = p_match_id
      and bp.scored_at is null
  loop
    pts := calculate_base_prediction_points(
      pred.predicted_winner,
      m.regulation_home_score,
      m.regulation_away_score,
      pred.points_per_hit
    );

    update base_predictions
    set points = pts, scored_at = now(), updated_at = now()
    where id = pred.id;
  end loop;
end;
$$;

create or replace function public.on_match_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  first_goal record;
  pts integer;
  score_pts integer;
  total_pts integer;
  goal_minute integer;
  goal_extra integer;
  goal_second integer;
  complete boolean;
  reg_home integer;
  reg_away integer;
begin
  if old.status = 'finished' or new.status != 'finished' then
    return new;
  end if;

  reg_home := coalesce(new.regulation_home_score, 0);
  reg_away := coalesce(new.regulation_away_score, 0);

  select
    me.minute,
    coalesce(me.extra_time, 0) as extra_time,
    coalesce(me.event_second, 0) as event_second
  into first_goal
  from match_events me
  where me.match_id = new.id
    and me.event_type = 'goal'
  order by me.minute asc, me.extra_time asc, me.event_second asc, me.created_at asc
  limit 1;

  if first_goal is null then
    goal_minute := null;
    goal_extra := 0;
    goal_second := 0;
  else
    goal_minute := first_goal.minute;
    goal_extra := first_goal.extra_time;
    goal_second := first_goal.event_second;
  end if;

  for pred in
    select * from predictions
    where match_id = new.id
      and scored_at is null
  loop
    complete := user_has_complete_predictions(pred.user_id, new.id);

    if pred.prediction_type = 'goal' then
      if complete then
        pts := calculate_first_goal_minute_points(
          pred.predicted_minute,
          goal_minute,
          goal_extra,
          goal_second
        );
      else
        pts := 0;
      end if;

      update predictions set points = pts, scored_at = now() where id = pred.id;
      total_pts := pts;
    else
      if complete then
        score_pts := calculate_winner_prediction_points(
          pred.predicted_winner,
          reg_home,
          reg_away
        );
      else
        score_pts := 0;
      end if;

      update predictions set score_points = score_pts, scored_at = now() where id = pred.id;
      total_pts := score_pts;
    end if;

    if complete and total_pts > 0 then
      update profiles set points = points + total_pts where id = pred.user_id;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists match_finished_trigger on public.matches;
create trigger match_finished_trigger
  after update on public.matches
  for each row execute function public.on_match_finished();

notify pgrst, 'reload schema';
