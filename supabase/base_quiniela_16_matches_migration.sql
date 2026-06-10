-- Corregir quiniela base a jornadas de 16 partidos (si corriste la versión de 6)
-- Ejecutar en SQL Editor de Supabase

alter table public.base_quiniela_rounds
  alter column match_count set default 16;

alter table public.base_quiniela_round_matches
  drop constraint if exists base_quiniela_round_matches_position_check;

alter table public.base_quiniela_round_matches
  add constraint base_quiniela_round_matches_position_check
  check (position >= 1 and position <= 16);

create or replace function public.seed_base_quiniela_rounds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  current_round_id uuid;
  current_round_num int := 0;
  pos int := 0;
  rounds_created int := 0;
  chunk_size int := 16;
begin
  delete from public.base_predictions;
  delete from public.base_quiniela_round_matches;
  delete from public.base_quiniela_rounds;

  for m in
    select id
    from matches
    where match_date is not null
    order by match_date asc, created_at asc
  loop
    if pos = 0 then
      current_round_num := current_round_num + 1;
      insert into base_quiniela_rounds (round_number, title, match_count, points_per_hit)
      values (current_round_num, 'Jornada ' || current_round_num, chunk_size, 50)
      returning id into current_round_id;
      rounds_created := rounds_created + 1;
    end if;

    pos := pos + 1;

    insert into base_quiniela_round_matches (round_id, match_id, position)
    values (current_round_id, m.id, pos);

    if pos >= chunk_size then
      pos := 0;
    end if;
  end loop;

  return rounds_created;
end;
$$;

select public.seed_base_quiniela_rounds();

notify pgrst, 'reload schema';
