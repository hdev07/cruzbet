begin;

-- HT es un estado, no el último minuto agregado del primer tiempo.
create or replace function public.normalize_halftime_clock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.live_clock_display = 'HT' then
    new.current_minute := 45;
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_halftime_clock_before_write on public.matches;
create trigger normalize_halftime_clock_before_write
before insert or update of live_clock_display, current_minute
on public.matches
for each row
execute function public.normalize_halftime_clock();

revoke all on function public.normalize_halftime_clock() from public;
revoke all on function public.normalize_halftime_clock() from anon;
revoke all on function public.normalize_halftime_clock() from authenticated;

update public.matches
set current_minute = 45
where live_clock_display = 'HT'
  and current_minute is distinct from 45;

commit;
