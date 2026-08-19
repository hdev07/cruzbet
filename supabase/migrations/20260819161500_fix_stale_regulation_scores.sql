-- Al pasar a finished, el trigger BEFORE UPDATE leía home_score de la fila
-- vieja (0-0) porque ESPN aún no persistía goles. El marcador real (6-1) se
-- guardaba después y el 0-0 reglamentario dejaba todos los resultados en E.

begin;

create or replace function public.set_regulation_scores_before_finish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  goal_count integer;
begin
  if new.status is distinct from 'finished' then
    return new;
  end if;

  select count(*)
  into goal_count
  from public.match_events
  where match_id = new.id
    and event_type = 'goal'
    and public.is_regulation_time_goal(minute);

  if coalesce(goal_count, 0) > 0 then
    select r.reg_home, r.reg_away
    into s
    from public.compute_regulation_scores(new.id) as r;
    new.regulation_home_score := s.reg_home;
    new.regulation_away_score := s.reg_away;
    return new;
  end if;

  if old.status is distinct from 'finished'
     or (
       coalesce(new.regulation_home_score, 0) = 0
       and coalesce(new.regulation_away_score, 0) = 0
       and (coalesce(new.home_score, 0) <> 0 or coalesce(new.away_score, 0) <> 0)
     )
  then
    new.regulation_home_score := coalesce(new.home_score, 0);
    new.regulation_away_score := coalesce(new.away_score, 0);
  end if;

  return new;
end;
$$;

update public.matches
set
  regulation_home_score = home_score,
  regulation_away_score = away_score
where status = 'finished'
  and coalesce(regulation_home_score, 0) = 0
  and coalesce(regulation_away_score, 0) = 0
  and (coalesce(home_score, 0) <> 0 or coalesce(away_score, 0) <> 0);

do $$
declare
  mid uuid;
begin
  for mid in
    select id from public.matches where status = 'finished'
  loop
    perform public.score_base_predictions_for_match(mid);
  end loop;
end;
$$;

notify pgrst, 'reload schema';

commit;
