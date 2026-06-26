-- Cuadro eliminatorio provisional en tiempo real (partidos en vivo + al terminar cada grupo)
-- Ejecutar en Supabase después de fifa_annex_c_migration.sql

-- ─── Standings incluyen partidos en vivo (marcador actual) ───────────────────

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
      and m.status in ('finished', 'live')
      and gt.id in (m.home_team_id, m.away_team_id)
      and m.home_team_id in (select id from group_teams)
      and m.away_team_id in (select id from group_teams)
    group by gt.id, gt.name
  )
  select team_id, points, goal_diff, goals_for, team_name
  from stats
  order by points desc, goal_diff desc, goals_for desc, team_name asc;
$$;

-- ─── Al terminar un partido de grupo: cuadro provisional ────────────────────

create or replace function public.on_match_finished(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ph text;
begin
  select phase into ph from matches where id = p_match_id;
  if ph is null then
    return;
  end if;

  if ph = 'group' then
    perform public.fill_knockout_r32_from_groups(true);
  elsif ph in ('r32', 'r16', 'qf', 'sf') then
    perform public.advance_knockout_from_match(p_match_id);
  end if;
end;
$$;

-- ─── Durante partidos en vivo: recalcular al cambiar el marcador ────────────

create or replace function public.on_bracket_live_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phase != 'group' or new.status != 'live' then
    return new;
  end if;

  if old.home_score is distinct from new.home_score
     or old.away_score is distinct from new.away_score then
    perform public.fill_knockout_r32_from_groups(true);
  end if;

  return new;
end;
$$;

drop trigger if exists bracket_live_update_trigger on public.matches;
create trigger bracket_live_update_trigger
  after update of home_score, away_score on public.matches
  for each row
  execute function public.on_bracket_live_update();

notify pgrst, 'reload schema';
