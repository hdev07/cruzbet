-- Nombre personalizado por quiniela (entry_number) en cada jornada
-- Ejecutar en SQL Editor DESPUÉS de base_quiniela_multiple_entries_migration.sql
-- Idempotente.

alter table public.base_round_payments
  add column if not exists entry_name text;

alter table public.base_round_payments
  drop constraint if exists base_round_payments_entry_name_check;
alter table public.base_round_payments
  add constraint base_round_payments_entry_name_check
  check (entry_name is null or char_length(trim(entry_name)) between 1 and 30);

create or replace function public.update_base_entry_name(
  p_round_id uuid,
  p_entry_number int,
  p_entry_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := nullif(trim(p_entry_name), '');
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if p_entry_number is null or p_entry_number < 1 then
    raise exception 'Número de quiniela inválido';
  end if;

  if v_name is not null and char_length(v_name) > 30 then
    raise exception 'Máximo 30 caracteres';
  end if;

  insert into public.base_round_payments (user_id, round_id, entry_number, verified, entry_name)
  values (v_user_id, p_round_id, p_entry_number, false, v_name)
  on conflict (user_id, round_id, entry_number) do update
  set entry_name = excluded.entry_name;
end;
$$;

revoke all on function public.update_base_entry_name(uuid, int, text) from public;
grant execute on function public.update_base_entry_name(uuid, int, text) to authenticated;

drop view if exists public.base_round_leaderboard;

create view public.base_round_leaderboard
with (security_invoker = true)
as
select
  bp.round_id,
  bp.user_id,
  bp.entry_number,
  brp.entry_name,
  p.username,
  p.avatar,
  count(*)::int as predictions_count,
  count(*) filter (where bp.points > 0)::int as correct_count,
  coalesce(sum(bp.points), 0)::int as total_points,
  r.match_count,
  (count(*) = r.match_count) as is_complete
from public.base_predictions bp
join public.profiles p on p.id = bp.user_id
join public.base_quiniela_rounds r on r.id = bp.round_id
inner join public.base_round_payments brp
  on brp.user_id = bp.user_id
  and brp.round_id = bp.round_id
  and brp.entry_number = bp.entry_number
  and brp.verified = true
group by bp.round_id, bp.user_id, bp.entry_number, brp.entry_name, p.username, p.avatar, r.match_count;

grant select on public.base_round_leaderboard to anon, authenticated;

notify pgrst, 'reload schema';
