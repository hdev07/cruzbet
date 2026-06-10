-- Fix: "No autorizado" al verificar depósitos
-- Ejecutar en SQL Editor de Supabase si ya corriste payment_verification_migration.sql

create or replace function public.is_jwt_admin()
returns boolean
language sql
stable
as $$
  select
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'hcruz0716@gmail.com';
$$;

create or replace function public.admin_set_payment_verified(
  p_user_id uuid,
  p_match_id uuid,
  p_verified boolean
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

  insert into match_payments (user_id, match_id, verified, verified_at)
  values (
    p_user_id,
    p_match_id,
    p_verified,
    case when p_verified then now() else null end
  )
  on conflict (user_id, match_id) do update
  set
    verified = excluded.verified,
    verified_at = excluded.verified_at;

  perform public.recalc_profile_points(p_user_id);
end;
$$;

drop policy if exists "match_payments_admin_write" on match_payments;
create policy "match_payments_admin_write" on match_payments
  for all to authenticated
  using (public.is_jwt_admin())
  with check (public.is_jwt_admin());

notify pgrst, 'reload schema';
