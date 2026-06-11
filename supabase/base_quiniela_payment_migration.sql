-- Verificación de depósito por jornada (quiniela base)
-- Ejecutar en SQL Editor de Supabase DESPUÉS de base_quiniela_migration.sql

-- 1) Registro de pago por usuario y jornada
create table if not exists public.base_round_payments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  round_id uuid not null references public.base_quiniela_rounds(id) on delete cascade,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz default now(),
  primary key (user_id, round_id)
);

create index if not exists base_round_payments_round_id_idx
  on public.base_round_payments(round_id);

create index if not exists base_round_payments_verified_idx
  on public.base_round_payments(round_id, verified);

-- Auto-crear fila al guardar la primera predicción de la jornada
create or replace function public.ensure_base_round_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.base_round_payments (user_id, round_id, verified)
  values (NEW.user_id, NEW.round_id, false)
  on conflict (user_id, round_id) do nothing;
  return NEW;
end;
$$;

drop trigger if exists base_predictions_ensure_payment on public.base_predictions;
create trigger base_predictions_ensure_payment
  after insert on public.base_predictions
  for each row execute function public.ensure_base_round_payment();

-- Backfill para predicciones existentes
insert into public.base_round_payments (user_id, round_id, verified)
select distinct user_id, round_id, false
from public.base_predictions
on conflict (user_id, round_id) do nothing;

-- 2) RPC admin: marcar depósito verificado / no verificado
create or replace function public.admin_set_base_payment_verified(
  p_user_id uuid,
  p_round_id uuid,
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

  insert into public.base_round_payments (user_id, round_id, verified, verified_at)
  values (
    p_user_id,
    p_round_id,
    p_verified,
    case when p_verified then now() else null end
  )
  on conflict (user_id, round_id) do update
  set
    verified = excluded.verified,
    verified_at = excluded.verified_at;
end;
$$;

revoke all on function public.admin_set_base_payment_verified(uuid, uuid, boolean) from public;
grant execute on function public.admin_set_base_payment_verified(uuid, uuid, boolean) to authenticated;

-- 3) Leaderboard: solo participantes con depósito verificado y quiniela completa
create or replace view public.base_round_leaderboard
with (security_invoker = true)
as
select
  bp.round_id,
  bp.user_id,
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
  and brp.verified = true
group by bp.round_id, bp.user_id, p.username, p.avatar, r.match_count;

-- 4) RLS
alter table public.base_round_payments enable row level security;

drop policy if exists "base_round_payments_select" on public.base_round_payments;
create policy "base_round_payments_select"
  on public.base_round_payments for select
  to anon, authenticated
  using (true);

drop policy if exists "base_round_payments_admin_write" on public.base_round_payments;
create policy "base_round_payments_admin_write"
  on public.base_round_payments for all
  to authenticated
  using (public.is_jwt_admin())
  with check (public.is_jwt_admin());

grant select on public.base_round_payments to anon, authenticated;
grant insert, update, delete on public.base_round_payments to authenticated;

notify pgrst, 'reload schema';
