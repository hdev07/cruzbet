-- Auto-actualización del cuadro eliminatorio al finalizar partidos
-- Ejecutar en Supabase si los dieciseisavos no se llenan solos al terminar grupos.
-- Requiere: knockout_bracket_migration.sql + fifa_annex_c_data.sql + fifa_annex_c_migration.sql

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

create or replace function public.on_bracket_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'finished' or new.status != 'finished' then
    return new;
  end if;

  perform public.on_match_finished(new.id);
  return new;
end;
$$;

drop trigger if exists bracket_update_trigger on public.matches;
create trigger bracket_update_trigger
  after update of status on public.matches
  for each row
  execute function public.on_bracket_update();

revoke all on function public.on_match_finished(uuid) from public;
grant execute on function public.on_match_finished(uuid) to service_role;

notify pgrst, 'reload schema';
