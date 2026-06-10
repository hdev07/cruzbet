-- Migración: reactivar partido finalizado y sincronizar marcador al editar goles
-- Ejecutar en SQL Editor de Supabase

-- Recalcula puntos globales de un usuario desde predicciones ya puntuadas
create or replace function public.recalc_profile_points_from_predictions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  select coalesce(sum(
    case
      when prediction_type = 'score' then coalesce(score_points, 0)
      else coalesce(points, 0)
    end
  ), 0) into total
  from predictions
  where user_id = p_user_id
    and scored_at is not null;

  update profiles set points = total where id = p_user_id;
end;
$$;

-- Sincroniza marcador y minuto del partido según los goles registrados
create or replace function public.sync_match_score_from_goals(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  home_id uuid;
  h_score integer;
  a_score integer;
  max_min integer;
begin
  select home_team_id into home_id from matches where id = p_match_id;

  select
    count(*) filter (where team_id = home_id),
    count(*) filter (where team_id is distinct from home_id)
  into h_score, a_score
  from match_events
  where match_id = p_match_id
    and event_type = 'goal';

  select coalesce(max(minute), 0) into max_min
  from match_events
  where match_id = p_match_id
    and event_type = 'goal';

  update matches
  set
    home_score = coalesce(h_score, 0),
    away_score = coalesce(a_score, 0),
    current_minute = greatest(coalesce(current_minute, 0), max_min)
  where id = p_match_id;
end;
$$;

-- Al reabrir un partido: anula puntuación y recalcula perfiles afectados
create or replace function public.on_match_reopened()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if OLD.status != 'finished' or NEW.status = 'finished' then
    return NEW;
  end if;

  update predictions
  set points = 0, score_points = 0, scored_at = null
  where match_id = NEW.id;

  update base_predictions
  set points = 0, scored_at = null, updated_at = now()
  where match_id = NEW.id;

  for uid in
    select distinct user_id from predictions where match_id = NEW.id
  loop
    perform public.recalc_profile_points_from_predictions(uid);
  end loop;

  return NEW;
end;
$$;

drop trigger if exists match_reopened_trigger on public.matches;
create trigger match_reopened_trigger
  before update on public.matches
  for each row execute function public.on_match_reopened();

-- Deshacer inicio accidental: live → scheduled (borra goles y resetea marcador)
create or replace function public.on_match_reverted_to_scheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status != 'live' or NEW.status != 'scheduled' then
    return NEW;
  end if;

  delete from match_events where match_id = NEW.id;

  NEW.home_score := 0;
  NEW.away_score := 0;
  NEW.current_minute := 0;

  return NEW;
end;
$$;

drop trigger if exists match_reverted_to_scheduled_trigger on public.matches;
create trigger match_reverted_to_scheduled_trigger
  before update on public.matches
  for each row execute function public.on_match_reverted_to_scheduled();

-- Tras editar o borrar goles: mantener marcador coherente
create or replace function public.on_goal_event_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  mid := coalesce(NEW.match_id, OLD.match_id);

  if TG_OP = 'DELETE' then
    if OLD.event_type = 'goal' then
      perform public.sync_match_score_from_goals(mid);
    end if;
    return OLD;
  end if;

  if NEW.event_type = 'goal' or (TG_OP = 'UPDATE' and OLD.event_type = 'goal') then
    perform public.sync_match_score_from_goals(NEW.match_id);
  end if;

  return NEW;
end;
$$;

drop trigger if exists goal_event_changed_trigger on public.match_events;
create trigger goal_event_changed_trigger
  after insert or update or delete on public.match_events
  for each row execute function public.on_goal_event_changed();

notify pgrst, 'reload schema';
