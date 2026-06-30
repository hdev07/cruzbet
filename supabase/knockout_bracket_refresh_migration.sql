-- Re-sincroniza ganadores en las llaves (incluye penales ya guardados)
-- Requiere: knockout_penalty_advance_fix.sql (función _match_knockout_winner_team_id)
-- Ejecutar en SQL Editor de Supabase

create or replace function public.refresh_knockout_bracket()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
  r jsonb;
  total int := 0;
  updated int := 0;
begin
  for mid in
    select m.id
    from matches m
    where m.status = 'finished'
      and m.bracket_key is not null
      and m.phase in ('r32', 'r16', 'qf', 'sf')
      and public._match_knockout_winner_team_id(
        m.home_team_id, m.away_team_id,
        m.home_score, m.away_score,
        m.penalty_home_score, m.penalty_away_score
      ) is not null
    order by (m.bracket_meta ->> 'match_number')::int nulls last
  loop
    total := total + 1;
    r := public.advance_knockout_from_match(mid);
    if coalesce((r ->> 'updated')::int, 0) > 0 then
      updated := updated + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'processed', total, 'slots_updated', updated);
end;
$$;

revoke all on function public.refresh_knockout_bracket() from public;
grant execute on function public.refresh_knockout_bracket() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
