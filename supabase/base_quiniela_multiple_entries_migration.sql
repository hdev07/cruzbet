-- Múltiples quinielas por jornada (entry_number)
-- Ejecutar en SQL Editor DESPUÉS de base_quiniela_submit_migration.sql
-- Idempotente: puede ejecutarse más de una vez.

-- 1) entry_number en predicciones
alter table public.base_predictions
  add column if not exists entry_number int not null default 1;

alter table public.base_predictions
  drop constraint if exists base_predictions_entry_number_check;
alter table public.base_predictions
  add constraint base_predictions_entry_number_check
  check (entry_number >= 1);

alter table public.base_predictions
  drop constraint if exists base_predictions_user_id_round_id_match_id_key;
alter table public.base_predictions
  drop constraint if exists base_predictions_user_id_round_id_entry_number_match_id_key;
alter table public.base_predictions
  add constraint base_predictions_user_id_round_id_entry_number_match_id_key
  unique (user_id, round_id, entry_number, match_id);

create index if not exists base_predictions_round_user_entry_idx
  on public.base_predictions(round_id, user_id, entry_number);

-- 2) entry_number en pagos
alter table public.base_round_payments
  add column if not exists entry_number int not null default 1;

alter table public.base_round_payments
  drop constraint if exists base_round_payments_entry_number_check;
alter table public.base_round_payments
  add constraint base_round_payments_entry_number_check
  check (entry_number >= 1);

alter table public.base_round_payments
  drop constraint if exists base_round_payments_pkey;
alter table public.base_round_payments
  add primary key (user_id, round_id, entry_number);

-- 3) Auto-crear fila de pago por entrada
create or replace function public.ensure_base_round_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.base_round_payments (user_id, round_id, entry_number, verified)
  values (NEW.user_id, NEW.round_id, NEW.entry_number, false)
  on conflict (user_id, round_id, entry_number) do nothing;
  return NEW;
end;
$$;

-- 4) Guardar quiniela por entrada
create or replace function public.submit_base_quiniela(
  p_round_id uuid,
  p_entry_number int default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_count int;
  v_pred_count int;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if p_entry_number is null or p_entry_number < 1 then
    raise exception 'Número de quiniela inválido';
  end if;

  select match_count into v_match_count
  from public.base_quiniela_rounds
  where id = p_round_id;

  if v_match_count is null then
    raise exception 'Jornada no encontrada';
  end if;

  select count(*)::int into v_pred_count
  from public.base_predictions
  where user_id = v_user_id
    and round_id = p_round_id
    and entry_number = p_entry_number;

  if v_pred_count < v_match_count then
    raise exception 'Debes marcar todos los partidos antes de guardar';
  end if;

  if exists (
    select 1 from public.base_round_payments
    where user_id = v_user_id
      and round_id = p_round_id
      and entry_number = p_entry_number
      and submitted_at is not null
  ) then
    raise exception 'Tu quiniela ya está guardada';
  end if;

  insert into public.base_round_payments (user_id, round_id, entry_number, verified, submitted_at)
  values (v_user_id, p_round_id, p_entry_number, false, now())
  on conflict (user_id, round_id, entry_number) do update
  set submitted_at = coalesce(base_round_payments.submitted_at, now());
end;
$$;

revoke all on function public.submit_base_quiniela(uuid, int) from public;
grant execute on function public.submit_base_quiniela(uuid, int) to authenticated;

-- Compatibilidad con firma anterior (1 parámetro)
drop function if exists public.submit_base_quiniela(uuid);

-- 5) Admin: verificar pago por entrada
create or replace function public.admin_set_base_payment_verified(
  p_user_id uuid,
  p_round_id uuid,
  p_verified boolean,
  p_entry_number int default 1
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

  if p_entry_number is null or p_entry_number < 1 then
    raise exception 'Número de quiniela inválido';
  end if;

  insert into public.base_round_payments (user_id, round_id, entry_number, verified, verified_at)
  values (
    p_user_id,
    p_round_id,
    p_entry_number,
    p_verified,
    case when p_verified then now() else null end
  )
  on conflict (user_id, round_id, entry_number) do update
  set
    verified = excluded.verified,
    verified_at = excluded.verified_at;
end;
$$;

revoke all on function public.admin_set_base_payment_verified(uuid, uuid, boolean, int) from public;
grant execute on function public.admin_set_base_payment_verified(uuid, uuid, boolean, int) to authenticated;

drop function if exists public.admin_set_base_payment_verified(uuid, uuid, boolean);

-- 6) Admin: reset por entrada
create or replace function public.admin_reset_base_quiniela(
  p_user_id uuid,
  p_round_id uuid,
  p_entry_number int default 1
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

  if p_entry_number is null or p_entry_number < 1 then
    raise exception 'Número de quiniela inválido';
  end if;

  delete from public.base_predictions
  where user_id = p_user_id
    and round_id = p_round_id
    and entry_number = p_entry_number;

  update public.base_round_payments
  set submitted_at = null
  where user_id = p_user_id
    and round_id = p_round_id
    and entry_number = p_entry_number;
end;
$$;

revoke all on function public.admin_reset_base_quiniela(uuid, uuid, int) from public;
grant execute on function public.admin_reset_base_quiniela(uuid, uuid, int) to authenticated;

drop function if exists public.admin_reset_base_quiniela(uuid, uuid);

-- 7) Leaderboard: una fila por quiniela (entrada)
-- CREATE OR REPLACE no permite insertar columnas en medio; hay que recrear la vista.
drop view if exists public.base_round_leaderboard;

create view public.base_round_leaderboard
with (security_invoker = true)
as
select
  bp.round_id,
  bp.user_id,
  bp.entry_number,
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
group by bp.round_id, bp.user_id, bp.entry_number, p.username, p.avatar, r.match_count;

grant select on public.base_round_leaderboard to anon, authenticated;

-- 8) RLS: bloqueo por entrada
drop policy if exists "users update own base predictions" on public.base_predictions;
create policy "users update own base predictions"
  on public.base_predictions for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.base_round_payments brp
      where brp.user_id = base_predictions.user_id
        and brp.round_id = base_predictions.round_id
        and brp.entry_number = base_predictions.entry_number
        and brp.submitted_at is not null
    )
  )
  with check (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.base_round_payments brp
      where brp.user_id = base_predictions.user_id
        and brp.round_id = base_predictions.round_id
        and brp.entry_number = base_predictions.entry_number
        and brp.submitted_at is not null
    )
  );

drop policy if exists "users delete own base predictions" on public.base_predictions;
create policy "users delete own base predictions"
  on public.base_predictions for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.base_round_payments brp
      where brp.user_id = base_predictions.user_id
        and brp.round_id = base_predictions.round_id
        and brp.entry_number = base_predictions.entry_number
        and brp.submitted_at is not null
    )
  );

notify pgrst, 'reload schema';
