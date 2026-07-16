-- Admin: cambiar un pick L/E/V de un jugador (aunque la quiniela ya esté guardada).

create or replace function public.admin_set_base_prediction(
  p_user_id uuid,
  p_round_id uuid,
  p_match_id uuid,
  p_winner text,
  p_entry_number int default 1
)
returns public.base_predictions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.base_predictions;
  match_row public.matches%rowtype;
  round_row public.base_quiniela_rounds%rowtype;
  belongs boolean;
begin
  if not public.is_jwt_admin() then
    raise exception 'No autorizado';
  end if;

  if p_entry_number is null or p_entry_number < 1 then
    raise exception 'Número de quiniela inválido';
  end if;

  if p_winner is null or p_winner not in ('home', 'draw', 'away') then
    raise exception 'Pick inválido: usa home, draw o away';
  end if;

  select * into round_row from public.base_quiniela_rounds where id = p_round_id;
  if round_row.id is null then
    raise exception 'Jornada no encontrada';
  end if;

  select exists (
    select 1
    from public.base_quiniela_round_matches
    where round_id = p_round_id
      and match_id = p_match_id
  ) into belongs;

  if not belongs then
    raise exception 'El partido no pertenece a esta jornada';
  end if;

  select * into match_row from public.matches where id = p_match_id;
  if match_row.id is null then
    raise exception 'Partido no encontrado';
  end if;

  insert into public.base_predictions (
    user_id,
    round_id,
    entry_number,
    match_id,
    predicted_winner,
    updated_at
  )
  values (
    p_user_id,
    p_round_id,
    p_entry_number,
    p_match_id,
    p_winner,
    now()
  )
  on conflict (user_id, round_id, entry_number, match_id) do update
  set
    predicted_winner = excluded.predicted_winner,
    updated_at = now()
  returning * into result;

  -- Si el partido ya terminó, recalcular puntos de ese pick.
  if match_row.status = 'finished' then
    update public.base_predictions
    set
      points = public.calculate_base_prediction_points(
        p_winner,
        match_row.home_score,
        match_row.away_score,
        round_row.points_per_hit
      ),
      scored_at = now(),
      updated_at = now()
    where id = result.id
    returning * into result;
  else
    update public.base_predictions
    set
      points = 0,
      scored_at = null,
      updated_at = now()
    where id = result.id
      and scored_at is not null
    returning * into result;
  end if;

  -- Asegura fila de pago si faltaba (no fuerza submitted_at).
  insert into public.base_round_payments (user_id, round_id, entry_number)
  values (p_user_id, p_round_id, p_entry_number)
  on conflict (user_id, round_id, entry_number) do nothing;

  return result;
end;
$$;

revoke all on function public.admin_set_base_prediction(uuid, uuid, uuid, text, int) from public;
grant execute on function public.admin_set_base_prediction(uuid, uuid, uuid, text, int) to authenticated;
