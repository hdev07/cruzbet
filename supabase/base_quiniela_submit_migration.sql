-- Bloqueo de quiniela base al guardar definitivamente
-- Ejecutar en SQL Editor de Supabase DESPUÉS de base_quiniela_payment_migration.sql

alter table public.base_round_payments
  add column if not exists submitted_at timestamptz;

-- Backfill: quinielas ya completas se consideran guardadas
insert into public.base_round_payments (user_id, round_id, verified, submitted_at)
select bp.user_id, bp.round_id, false, now()
from public.base_predictions bp
join public.base_quiniela_rounds r on r.id = bp.round_id
group by bp.user_id, bp.round_id, r.match_count
having count(*) = r.match_count
on conflict (user_id, round_id) do update
set submitted_at = coalesce(base_round_payments.submitted_at, excluded.submitted_at);

-- RPC: guardar quiniela definitivamente (requiere todos los partidos marcados)
create or replace function public.submit_base_quiniela(p_round_id uuid)
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

  select match_count into v_match_count
  from public.base_quiniela_rounds
  where id = p_round_id;

  if v_match_count is null then
    raise exception 'Jornada no encontrada';
  end if;

  select count(*)::int into v_pred_count
  from public.base_predictions
  where user_id = v_user_id and round_id = p_round_id;

  if v_pred_count < v_match_count then
    raise exception 'Debes marcar todos los partidos antes de guardar';
  end if;

  if exists (
    select 1 from public.base_round_payments
    where user_id = v_user_id
      and round_id = p_round_id
      and submitted_at is not null
  ) then
    raise exception 'Tu quiniela ya está guardada';
  end if;

  insert into public.base_round_payments (user_id, round_id, verified, submitted_at)
  values (v_user_id, p_round_id, false, now())
  on conflict (user_id, round_id) do update
  set submitted_at = coalesce(base_round_payments.submitted_at, now());
end;
$$;

revoke all on function public.submit_base_quiniela(uuid) from public;
grant execute on function public.submit_base_quiniela(uuid) to authenticated;

-- No permitir editar predicciones una vez guardada la quiniela
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
        and brp.submitted_at is not null
    )
  )
  with check (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.base_round_payments brp
      where brp.user_id = base_predictions.user_id
        and brp.round_id = base_predictions.round_id
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
        and brp.submitted_at is not null
    )
  );

notify pgrst, 'reload schema';
