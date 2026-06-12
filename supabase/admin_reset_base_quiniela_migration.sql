-- Admin: reestablecer quiniela base de un jugador en una jornada
-- Ejecutar en SQL Editor de Supabase DESPUÉS de base_quiniela_submit_migration.sql

create or replace function public.admin_reset_base_quiniela(
  p_user_id uuid,
  p_round_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_jwt_admin() then
    raise exception 'No autorizado';
  end if;

  delete from public.base_predictions
  where user_id = p_user_id
    and round_id = p_round_id;

  update public.base_round_payments
  set submitted_at = null
  where user_id = p_user_id
    and round_id = p_round_id;
end;
$$;

revoke all on function public.admin_reset_base_quiniela(uuid, uuid) from public;
grant execute on function public.admin_reset_base_quiniela(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
