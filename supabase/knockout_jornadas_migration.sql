-- Eliminatoria en jornadas por fase (después de jornadas 1–4 de grupos):
--   5 → Dieciseisavos (16)   phase r32
--   6 → Octavos (8)          phase r16
--   7 → Cuartos (4)          phase qf
--   8 → Semifinal (2)        phase sf
--   9 → Tercer lugar (1)     phase third
-- La final no entra en quiniela base.
-- Ejecutar en SQL Editor de Supabase

do $$
declare
  rec record;
  v_round_id uuid;
  v_count int;
begin
  -- Quitar predicciones de partidos eliminatorios que se reasignan
  delete from public.base_predictions bp
  using public.matches m
  where bp.match_id = m.id
    and m.phase in ('r32', 'r16', 'qf', 'sf', 'third');

  -- Sacar eliminatoria de cualquier jornada (cronológica anterior)
  delete from public.base_quiniela_round_matches brm
  using public.matches m
  where brm.match_id = m.id
    and m.phase in ('r32', 'r16', 'qf', 'sf', 'third');

  insert into public.base_quiniela_rounds (round_number, title, match_count, points_per_hit)
  values
    (5, 'Jornada 5 — Dieciseisavos', 16, 50),
    (6, 'Jornada 6 — Octavos', 8, 50),
    (7, 'Jornada 7 — Cuartos', 4, 50),
    (8, 'Jornada 8 — Semifinal', 2, 50),
    (9, 'Jornada 9 — Tercer lugar', 1, 50)
  on conflict (round_number) do update
  set title = excluded.title,
      match_count = excluded.match_count,
      points_per_hit = excluded.points_per_hit;

  for rec in
    select *
    from (values
      (5, 'r32'::text, 16),
      (6, 'r16', 8),
      (7, 'qf', 4),
      (8, 'sf', 2),
      (9, 'third', 1)
    ) as phases(round_number, phase, expected)
  loop
    select id into v_round_id
    from public.base_quiniela_rounds
    where round_number = rec.round_number;

    delete from public.base_quiniela_round_matches
    where round_id = v_round_id;

    insert into public.base_quiniela_round_matches (round_id, match_id, position)
    select
      v_round_id,
      m.id,
      row_number() over (order by m.match_date asc nulls last, m.bracket_key asc)::int
    from public.matches m
    where m.phase = rec.phase
    order by m.match_date asc nulls last, m.bracket_key asc;

    get diagnostics v_count = row_count;

    if v_count <> rec.expected then
      raise exception 'Jornada %: se esperaban % partidos (%); se insertaron %',
        rec.round_number, rec.expected, rec.phase, v_count;
    end if;
  end loop;

  raise notice 'Jornadas 5–9 configuradas por fase eliminatoria';
end;
$$;

notify pgrst, 'reload schema';
