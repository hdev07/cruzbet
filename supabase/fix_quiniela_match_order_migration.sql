-- Corregir orden de partidos en quiniela: del más temprano al más tarde (AM → PM)
-- Ejecutar en SQL Editor de Supabase

UPDATE matches m
SET bracket_key = 'M1',
    bracket_meta = '{"match_number":1}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MEX'
  AND a.code = 'RSA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M2',
    bracket_meta = '{"match_number":2}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'KOR'
  AND a.code = 'CZE'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M3',
    bracket_meta = '{"match_number":3}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CAN'
  AND a.code = 'BIH'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M4',
    bracket_meta = '{"match_number":4}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'USA'
  AND a.code = 'PAR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M5',
    bracket_meta = '{"match_number":5}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'HAI'
  AND a.code = 'SCO'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M6',
    bracket_meta = '{"match_number":6}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUS'
  AND a.code = 'TUR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M7',
    bracket_meta = '{"match_number":7}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M8',
    bracket_meta = '{"match_number":8}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'QAT'
  AND a.code = 'SUI'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M9',
    bracket_meta = '{"match_number":9}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CIV'
  AND a.code = 'ECU'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M10',
    bracket_meta = '{"match_number":10}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M11',
    bracket_meta = '{"match_number":11}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M12',
    bracket_meta = '{"match_number":12}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SWE'
  AND a.code = 'TUN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M13',
    bracket_meta = '{"match_number":13}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'KSA'
  AND a.code = 'URU'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M14',
    bracket_meta = '{"match_number":14}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ESP'
  AND a.code = 'CPV'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M15',
    bracket_meta = '{"match_number":15}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'IRN'
  AND a.code = 'NZL'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M16',
    bracket_meta = '{"match_number":16}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BEL'
  AND a.code = 'EGY'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M17',
    bracket_meta = '{"match_number":17}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'FRA'
  AND a.code = 'SEN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M18',
    bracket_meta = '{"match_number":18}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'IRQ'
  AND a.code = 'NOR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M19',
    bracket_meta = '{"match_number":19}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ARG'
  AND a.code = 'ALG'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M20',
    bracket_meta = '{"match_number":20}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'AUT'
  AND a.code = 'JOR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M21',
    bracket_meta = '{"match_number":21}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GHA'
  AND a.code = 'PAN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M22',
    bracket_meta = '{"match_number":22}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ENG'
  AND a.code = 'CRO'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M23',
    bracket_meta = '{"match_number":23}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'POR'
  AND a.code = 'COD'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M24',
    bracket_meta = '{"match_number":24}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'UZB'
  AND a.code = 'COL'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M25',
    bracket_meta = '{"match_number":25}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CZE'
  AND a.code = 'RSA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M26',
    bracket_meta = '{"match_number":26}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SUI'
  AND a.code = 'BIH'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M27',
    bracket_meta = '{"match_number":27}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CAN'
  AND a.code = 'QAT'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M28',
    bracket_meta = '{"match_number":28}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MEX'
  AND a.code = 'KOR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M29',
    bracket_meta = '{"match_number":29}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BRA'
  AND a.code = 'HAI'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M30',
    bracket_meta = '{"match_number":30}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SCO'
  AND a.code = 'MAR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M31',
    bracket_meta = '{"match_number":31}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUR'
  AND a.code = 'PAR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M32',
    bracket_meta = '{"match_number":32}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'USA'
  AND a.code = 'AUS'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M33',
    bracket_meta = '{"match_number":33}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'GER'
  AND a.code = 'CIV'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M34',
    bracket_meta = '{"match_number":34}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ECU'
  AND a.code = 'CUW'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M35',
    bracket_meta = '{"match_number":35}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NED'
  AND a.code = 'SWE'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M36',
    bracket_meta = '{"match_number":36}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUN'
  AND a.code = 'JPN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M37',
    bracket_meta = '{"match_number":37}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'URU'
  AND a.code = 'CPV'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M38',
    bracket_meta = '{"match_number":38}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ESP'
  AND a.code = 'KSA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M39',
    bracket_meta = '{"match_number":39}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BEL'
  AND a.code = 'IRN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M40',
    bracket_meta = '{"match_number":40}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NZL'
  AND a.code = 'EGY'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M41',
    bracket_meta = '{"match_number":41}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NOR'
  AND a.code = 'SEN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M42',
    bracket_meta = '{"match_number":42}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'FRA'
  AND a.code = 'IRQ'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M43',
    bracket_meta = '{"match_number":43}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ARG'
  AND a.code = 'AUT'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M44',
    bracket_meta = '{"match_number":44}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JOR'
  AND a.code = 'ALG'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M45',
    bracket_meta = '{"match_number":45}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ENG'
  AND a.code = 'GHA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M46',
    bracket_meta = '{"match_number":46}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAN'
  AND a.code = 'CRO'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M47',
    bracket_meta = '{"match_number":47}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'POR'
  AND a.code = 'UZB'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M48',
    bracket_meta = '{"match_number":48}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COL'
  AND a.code = 'COD'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M49',
    bracket_meta = '{"match_number":49}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SCO'
  AND a.code = 'BRA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M50',
    bracket_meta = '{"match_number":50}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'MAR'
  AND a.code = 'HAI'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M51',
    bracket_meta = '{"match_number":51}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SUI'
  AND a.code = 'CAN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M52',
    bracket_meta = '{"match_number":52}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'BIH'
  AND a.code = 'QAT'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M53',
    bracket_meta = '{"match_number":53}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CZE'
  AND a.code = 'MEX'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M54',
    bracket_meta = '{"match_number":54}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'RSA'
  AND a.code = 'KOR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M55',
    bracket_meta = '{"match_number":55}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CUW'
  AND a.code = 'CIV'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M56',
    bracket_meta = '{"match_number":56}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ECU'
  AND a.code = 'GER'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M57',
    bracket_meta = '{"match_number":57}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JPN'
  AND a.code = 'SWE'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M58',
    bracket_meta = '{"match_number":58}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUN'
  AND a.code = 'NED'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M59',
    bracket_meta = '{"match_number":59}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'TUR'
  AND a.code = 'USA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M60',
    bracket_meta = '{"match_number":60}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAR'
  AND a.code = 'AUS'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M61',
    bracket_meta = '{"match_number":61}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NOR'
  AND a.code = 'FRA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M62',
    bracket_meta = '{"match_number":62}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'SEN'
  AND a.code = 'IRQ'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M63',
    bracket_meta = '{"match_number":63}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'EGY'
  AND a.code = 'IRN'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M64',
    bracket_meta = '{"match_number":64}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'NZL'
  AND a.code = 'BEL'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M65',
    bracket_meta = '{"match_number":65}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CPV'
  AND a.code = 'KSA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M66',
    bracket_meta = '{"match_number":66}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'URU'
  AND a.code = 'ESP'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M67',
    bracket_meta = '{"match_number":67}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'PAN'
  AND a.code = 'ENG'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M68',
    bracket_meta = '{"match_number":68}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'CRO'
  AND a.code = 'GHA'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M69',
    bracket_meta = '{"match_number":69}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'ALG'
  AND a.code = 'AUT'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M70',
    bracket_meta = '{"match_number":70}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'JOR'
  AND a.code = 'ARG'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M71',
    bracket_meta = '{"match_number":71}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COL'
  AND a.code = 'POR'
  AND m.phase = 'group';

UPDATE matches m
SET bracket_key = 'M72',
    bracket_meta = '{"match_number":72}'::jsonb
FROM teams h, teams a
WHERE m.home_team_id = h.id
  AND m.away_team_id = a.id
  AND h.code = 'COD'
  AND a.code = 'UZB'
  AND m.phase = 'group';

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

-- Reconstruir jornadas en orden cronológico sin borrar predicciones
insert into public.base_quiniela_rounds (round_number, title, match_count, points_per_hit)
select gs.round_number, 'Jornada ' || gs.round_number, 16, 50
from generate_series(
  (select coalesce(max(round_number), 0) + 1 from public.base_quiniela_rounds),
  (select ceil(count(*)::numeric / 16) from public.matches where match_date is not null)
) as gs(round_number)
on conflict (round_number) do nothing;

delete from public.base_quiniela_round_matches;

insert into public.base_quiniela_round_matches (round_id, match_id, position)
select
  r.id,
  ordered.match_id,
  ordered.position
from (
  select
    m.id as match_id,
    ((row_number() over (order by m.match_date asc, m.created_at asc) - 1) / 16) + 1 as round_number,
    ((row_number() over (order by m.match_date asc, m.created_at asc) - 1) % 16) + 1 as position
  from public.matches m
  where m.match_date is not null
) ordered
join public.base_quiniela_rounds r on r.round_number = ordered.round_number;

notify pgrst, 'reload schema';
