-- Migración: verificación de depósito por partido (admin)
-- Ejecutar en SQL Editor de Supabase DESPUÉS de multiple_predictions_migration.sql

-- 1) Registro de pago por usuario y partido
create table if not exists match_payments (
  user_id uuid not null references profiles(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz default now(),
  primary key (user_id, match_id)
);

create index if not exists match_payments_match_id_idx on match_payments(match_id);
create index if not exists match_payments_verified_idx on match_payments(match_id, verified);

-- Auto-crear fila al guardar la primera predicción
create or replace function public.ensure_match_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into match_payments (user_id, match_id, verified)
  values (NEW.user_id, NEW.match_id, false)
  on conflict (user_id, match_id) do nothing;
  return NEW;
end;
$$;

drop trigger if exists predictions_ensure_payment on predictions;
create trigger predictions_ensure_payment
  after insert on predictions
  for each row execute function public.ensure_match_payment();

-- Backfill para predicciones existentes
insert into match_payments (user_id, match_id, verified)
select distinct user_id, match_id, false
from predictions
on conflict (user_id, match_id) do nothing;

-- 2) Recalcular puntos globales solo con partidos verificados
create or replace function public.recalc_profile_points(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  select coalesce(sum(
    case
      when p.prediction_type = 'score' then coalesce(p.score_points, 0)
      else coalesce(p.points, 0)
    end
  ), 0) into total
  from predictions p
  inner join match_payments mp
    on mp.user_id = p.user_id and mp.match_id = p.match_id
  where p.user_id = p_user_id
    and mp.verified = true
    and p.scored_at is not null;

  update profiles set points = total where id = p_user_id;
end;
$$;

-- Helper: admin vía app_metadata.role o email del organizador
create or replace function public.is_jwt_admin()
returns boolean
language sql
stable
as $$
  select
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'hcruz0716@gmail.com';
$$;

-- 3) RPC admin: marcar depósito verificado / no verificado
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

revoke all on function public.admin_set_payment_verified(uuid, uuid, boolean) from public;
grant execute on function public.admin_set_payment_verified(uuid, uuid, boolean) to authenticated;

-- 4) Al finalizar partido: puntúa predicciones pero NO suma a profiles (eso ocurre al verificar pago)
create or replace function public.on_match_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
  goal_event record;
  gteam text;
  home_id uuid;
  pts integer;
  event_pts integer;
  score_pts integer;
begin
  if OLD.status = 'finished' or NEW.status != 'finished' then
    return NEW;
  end if;

  select home_team_id into home_id from matches where id = NEW.id;

  for pred in
    select * from predictions
    where match_id = NEW.id
      and scored_at is null
  loop
    if pred.prediction_type = 'goal' then
      pts := 0;

      for goal_event in
        select me.minute, me.team_id
        from match_events me
        where me.match_id = NEW.id
          and me.event_type = 'goal'
        order by me.minute asc, me.created_at asc
      loop
        if goal_event.team_id = home_id then
          gteam := 'home';
        else
          gteam := 'away';
        end if;

        event_pts := calculate_prediction_points(
          pred.predicted_minute, pred.predicted_team,
          goal_event.minute, gteam
        );

        if event_pts > pts then
          pts := event_pts;
        end if;
      end loop;

      update predictions
      set points = pts, scored_at = now()
      where id = pred.id;
    else
      score_pts := calculate_score_prediction_points(
        pred.predicted_home_score,
        pred.predicted_away_score,
        NEW.home_score,
        NEW.away_score
      );

      update predictions
      set score_points = score_pts, scored_at = now()
      where id = pred.id;
    end if;
  end loop;

  return NEW;
end;
$$;

drop trigger if exists match_finished_trigger on matches;
create trigger match_finished_trigger
  after update on matches
  for each row execute function public.on_match_finished();

-- 5) Recalcular puntos globales de todos los perfiles
do $$
declare
  uid uuid;
begin
  for uid in select id from profiles loop
    perform public.recalc_profile_points(uid);
  end loop;
end;
$$;

-- 6) RLS
alter table match_payments enable row level security;

drop policy if exists "match_payments_select" on match_payments;
create policy "match_payments_select" on match_payments
  for select to anon, authenticated
  using (true);

drop policy if exists "match_payments_admin_write" on match_payments;
create policy "match_payments_admin_write" on match_payments
  for all to authenticated
  using (public.is_jwt_admin())
  with check (public.is_jwt_admin());

grant select on match_payments to anon, authenticated;
grant insert, update, delete on match_payments to authenticated;

notify pgrst, 'reload schema';
