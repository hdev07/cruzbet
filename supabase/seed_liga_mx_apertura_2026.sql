-- Calendario oficial Liga MX Apertura 2026.
-- Fuente: https://ligamx.net/cancha/calendarios
-- PDF publicado el 15 de julio de 2026.
-- Ejecutar después de 20260716183904_prepare_liga_mx_season.sql.
--
-- J8: Toluca vs Atlas y Cruz Azul vs América aparecen con opciones
-- 17:00 / 19:00 / 21:00. Se registra 17:00 (la hora más temprana)
-- para impedir predicciones después de un posible kickoff. Actualizar cuando
-- Liga MX confirme el horario definitivo.

begin;

do $$
begin
  if to_regclass('public.competitions') is null then
    raise exception 'Ejecuta primero prepare_liga_mx_season.sql';
  end if;
  if not exists (select 1 from public.competitions where slug = 'liga-mx-apertura-2026' and is_active) then
    raise exception 'La competencia liga-mx-apertura-2026 no existe o no está activa';
  end if;
end;
$$;

insert into public.teams (name, code, flag_url)
values
  ('América', 'AME', '/teams/ame.png'),
  ('Atlante', 'ATN', '/teams/atn.png'),
  ('Atlas', 'ATS', '/teams/ats.png'),
  ('Atlético de San Luis', 'ASL', '/teams/asl.png'),
  ('Tijuana', 'TIJ', '/teams/tij.png'),
  ('Cruz Azul', 'CAZ', '/teams/caz.png'),
  ('FC Juárez', 'JUA', '/teams/jua.png'),
  ('Querétaro', 'QRO', '/teams/qro.png'),
  ('Guadalajara', 'GDL', '/teams/gdl.png'),
  ('León', 'LEO', '/teams/leo.png'),
  ('Necaxa', 'NEC', '/teams/nec.png'),
  ('Pachuca', 'PAC', '/teams/pac.png'),
  ('Puebla', 'PUE', '/teams/pue.png'),
  ('Monterrey', 'MTY', '/teams/mty.png'),
  ('Santos Laguna', 'SAN', '/teams/san.png'),
  ('Tigres', 'TIG', '/teams/tig.png'),
  ('Toluca', 'TOL', '/teams/tol.png'),
  ('Pumas', 'PUM', '/teams/pum.png')
on conflict (code) do update
set name = excluded.name,
    flag_url = excluded.flag_url;

with competition as (
  select id from public.competitions where slug = 'liga-mx-apertura-2026'
)
insert into public.base_quiniela_rounds (
  id, competition_id, round_number, title, match_count, points_per_hit
)
select
  md5('liga-mx-apertura-2026-round-' || round_number)::uuid,
  competition.id,
  round_number,
  'Jornada ' || round_number,
  9,
  1
from competition
cross join generate_series(1, 17) as rounds(round_number)
on conflict (competition_id, round_number) do update
set title = excluded.title,
    match_count = excluded.match_count,
    points_per_hit = excluded.points_per_hit;

with fixture_values (round_number, position, home_code, away_code, kickoff, venue, kickoff_confirmed) as (
  values
    (1, 1, 'NEC', 'ATN', timestamptz '2026-07-16 19:00:00-06', 'VICTORIA', true),
    (1, 2, 'TIJ', 'TIG', timestamptz '2026-07-16 21:00:00-06', 'CALIENTE', true),
    (1, 3, 'ASL', 'CAZ', timestamptz '2026-07-17 19:00:00-06', 'LIBERTAD FINANCIERA', true),
    (1, 4, 'LEO', 'ATS', timestamptz '2026-07-17 19:00:00-06', 'NOU CAMP', true),
    (1, 5, 'JUA', 'PUE', timestamptz '2026-07-17 21:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (1, 6, 'PUM', 'PAC', timestamptz '2026-07-18 17:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (1, 7, 'GDL', 'TOL', timestamptz '2026-07-18 19:00:00-06', 'AKRON', true),
    (1, 8, 'MTY', 'SAN', timestamptz '2026-07-18 19:00:00-06', 'BBVA', true),
    (1, 9, 'QRO', 'AME', timestamptz '2026-07-18 21:00:00-06', 'LA CORREGIDORA', true),
    (2, 1, 'CAZ', 'PUE', timestamptz '2026-07-21 19:00:00-06', 'LA CORREGIDORA', true),
    (2, 2, 'TOL', 'PUM', timestamptz '2026-07-21 21:00:00-06', 'NEMESIO DIEZ', true),
    (2, 3, 'TIG', 'ASL', timestamptz '2026-07-24 19:00:00-06', 'UNIVERSITARIO', true),
    (2, 4, 'ATN', 'AME', timestamptz '2026-07-24 21:00:00-06', 'BANORTE', true),
    (2, 5, 'TIJ', 'LEO', timestamptz '2026-07-24 21:00:00-06', 'CALIENTE', true),
    (2, 6, 'GDL', 'JUA', timestamptz '2026-07-25 17:00:00-06', 'AKRON', true),
    (2, 7, 'SAN', 'ATS', timestamptz '2026-07-25 21:00:00-06', 'TSM CORONA', true),
    (2, 8, 'NEC', 'MTY', timestamptz '2026-07-26 17:00:00-06', 'VICTORIA', true),
    (2, 9, 'PAC', 'QRO', timestamptz '2026-07-26 19:00:00-06', 'HIDALGO', true),
    (3, 1, 'PUE', 'GDL', timestamptz '2026-07-31 19:00:00-06', 'CUAUHTÉMOC', true),
    (3, 2, 'ASL', 'TIJ', timestamptz '2026-07-31 21:00:00-06', 'LIBERTAD FINANCIERA', true),
    (3, 3, 'JUA', 'PUM', timestamptz '2026-07-31 21:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (3, 4, 'QRO', 'TIG', timestamptz '2026-08-01 17:00:00-06', 'LA CORREGIDORA', true),
    (3, 5, 'LEO', 'PAC', timestamptz '2026-08-01 19:00:00-06', 'NOU CAMP', true),
    (3, 6, 'ATS', 'MTY', timestamptz '2026-08-01 19:00:00-06', 'JALISCO', true),
    (3, 7, 'CAZ', 'ATN', timestamptz '2026-08-01 21:00:00-06', 'CD. DE LOS DEPORTES', true),
    (3, 8, 'AME', 'SAN', timestamptz '2026-08-02 17:00:00-06', 'BANORTE', true),
    (3, 9, 'TOL', 'NEC', timestamptz '2026-08-02 19:00:00-06', 'NEMESIO DIEZ', true),
    (4, 1, 'ATN', 'TOL', timestamptz '2026-08-15 17:00:00-06', 'BANORTE', true),
    (4, 2, 'MTY', 'JUA', timestamptz '2026-08-15 19:00:00-06', 'BBVA', true),
    (4, 3, 'ATS', 'TIG', timestamptz '2026-08-15 21:00:00-06', 'JALISCO', true),
    (4, 4, 'PUM', 'QRO', timestamptz '2026-08-16 12:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (4, 5, 'AME', 'ASL', timestamptz '2026-08-16 17:00:00-06', 'BANORTE', true),
    (4, 6, 'SAN', 'GDL', timestamptz '2026-08-16 19:00:00-06', 'TSM CORONA', true),
    (4, 7, 'TIJ', 'CAZ', timestamptz '2026-08-16 21:00:00-06', 'CALIENTE', true),
    (4, 8, 'NEC', 'LEO', timestamptz '2026-08-17 19:00:00-06', 'VICTORIA', true),
    (4, 9, 'PAC', 'PUE', timestamptz '2026-08-17 21:00:00-06', 'HIDALGO', true),
    (5, 1, 'PUE', 'SAN', timestamptz '2026-08-21 19:00:00-06', 'CUAUHTÉMOC', true),
    (5, 2, 'JUA', 'AME', timestamptz '2026-08-21 21:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (5, 3, 'QRO', 'TOL', timestamptz '2026-08-22 17:00:00-06', 'LA CORREGIDORA', true),
    (5, 4, 'GDL', 'TIJ', timestamptz '2026-08-22 17:00:00-06', 'AKRON', true),
    (5, 5, 'LEO', 'MTY', timestamptz '2026-08-22 19:00:00-06', 'NOU CAMP', true),
    (5, 6, 'TIG', 'ATN', timestamptz '2026-08-22 21:00:00-06', 'UNIVERSITARIO', true),
    (5, 7, 'CAZ', 'ATS', timestamptz '2026-08-22 21:00:00-06', 'CD. DE LOS DEPORTES', true),
    (5, 8, 'ASL', 'PAC', timestamptz '2026-08-23 17:00:00-06', 'LIBERTAD FINANCIERA', true),
    (5, 9, 'PUM', 'NEC', timestamptz '2026-08-23 19:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (6, 1, 'NEC', 'CAZ', timestamptz '2026-08-28 19:00:00-06', 'VICTORIA', true),
    (6, 2, 'ATN', 'LEO', timestamptz '2026-08-28 19:00:00-06', 'BANORTE', true),
    (6, 3, 'TIJ', 'PUM', timestamptz '2026-08-28 21:00:00-06', 'CALIENTE', true),
    (6, 4, 'ATS', 'QRO', timestamptz '2026-08-29 17:00:00-06', 'JALISCO', true),
    (6, 5, 'PAC', 'GDL', timestamptz '2026-08-29 17:00:00-06', 'HIDALGO', true),
    (6, 6, 'AME', 'PUE', timestamptz '2026-08-29 19:00:00-06', 'BANORTE', true),
    (6, 7, 'SAN', 'TIG', timestamptz '2026-08-29 21:00:00-06', 'TSM CORONA', true),
    (6, 8, 'TOL', 'JUA', timestamptz '2026-08-30 18:00:00-06', 'NEMESIO DIEZ', true),
    (6, 9, 'MTY', 'ASL', timestamptz '2026-08-30 20:00:00-06', 'BBVA', true),
    (7, 1, 'PUE', 'TOL', timestamptz '2026-09-04 19:00:00-06', 'CUAUHTÉMOC', true),
    (7, 2, 'JUA', 'PAC', timestamptz '2026-09-04 21:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (7, 3, 'ASL', 'GDL', timestamptz '2026-09-05 17:00:00-06', 'LIBERTAD FINANCIERA', true),
    (7, 4, 'QRO', 'MTY', timestamptz '2026-09-05 17:00:00-06', 'LA CORREGIDORA', true),
    (7, 5, 'TIG', 'NEC', timestamptz '2026-09-05 19:00:00-06', 'UNIVERSITARIO', true),
    (7, 6, 'AME', 'TIJ', timestamptz '2026-09-05 19:00:00-06', 'BANORTE', true),
    (7, 7, 'ATS', 'ATN', timestamptz '2026-09-05 21:00:00-06', 'JALISCO', true),
    (7, 8, 'PUM', 'LEO', timestamptz '2026-09-06 12:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (7, 9, 'CAZ', 'SAN', timestamptz '2026-09-06 20:00:00-06', 'CD. DE LOS DEPORTES', true),
    (8, 1, 'NEC', 'PUE', timestamptz '2026-09-11 19:00:00-06', 'VICTORIA', true),
    (8, 2, 'ATN', 'PAC', timestamptz '2026-09-11 21:00:00-06', 'BANORTE', true),
    (8, 3, 'TIJ', 'QRO', timestamptz '2026-09-11 21:00:00-06', 'CALIENTE', true),
    (8, 4, 'LEO', 'ASL', timestamptz '2026-09-12 17:00:00-06', 'NOU CAMP', true),
    (8, 5, 'TOL', 'ATS', timestamptz '2026-09-12 17:00:00-06', 'NEMESIO DIEZ', false),
    (8, 6, 'CAZ', 'AME', timestamptz '2026-09-12 17:00:00-06', 'CD. DE LOS DEPORTES', false),
    (8, 7, 'SAN', 'JUA', timestamptz '2026-09-13 18:00:00-06', 'TSM CORONA', true),
    (8, 8, 'GDL', 'PUM', timestamptz '2026-09-13 18:00:00-06', 'AKRON', true),
    (8, 9, 'MTY', 'TIG', timestamptz '2026-09-13 20:00:00-06', 'BBVA', true),
    (9, 1, 'PUE', 'ATN', timestamptz '2026-09-18 19:00:00-06', 'CUAUHTÉMOC', true),
    (9, 2, 'JUA', 'TIG', timestamptz '2026-09-18 21:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (9, 3, 'ATS', 'PUM', timestamptz '2026-09-19 17:00:00-06', 'JALISCO', true),
    (9, 4, 'ASL', 'NEC', timestamptz '2026-09-19 17:00:00-06', 'LIBERTAD FINANCIERA', true),
    (9, 5, 'MTY', 'CAZ', timestamptz '2026-09-19 19:00:00-06', 'BBVA', true),
    (9, 6, 'AME', 'GDL', timestamptz '2026-09-19 21:00:00-06', 'BANORTE', true),
    (9, 7, 'PAC', 'TIJ', timestamptz '2026-09-20 18:00:00-06', 'HIDALGO', true),
    (9, 8, 'TOL', 'SAN', timestamptz '2026-09-20 18:00:00-06', 'NEMESIO DIEZ', true),
    (9, 9, 'QRO', 'LEO', timestamptz '2026-09-20 20:00:00-06', 'LA CORREGIDORA', true),
    (10, 1, 'ATN', 'MTY', timestamptz '2026-09-25 19:00:00-06', 'BANORTE', true),
    (10, 2, 'TIJ', 'ATS', timestamptz '2026-09-25 21:00:00-06', 'CALIENTE', true),
    (10, 3, 'GDL', 'QRO', timestamptz '2026-09-26 17:00:00-06', 'AKRON', true),
    (10, 4, 'SAN', 'PAC', timestamptz '2026-09-26 19:00:00-06', 'TSM CORONA', true),
    (10, 5, 'TIG', 'PUE', timestamptz '2026-09-26 19:00:00-06', 'UNIVERSITARIO', true),
    (10, 6, 'CAZ', 'TOL', timestamptz '2026-09-26 21:00:00-06', 'CD. DE LOS DEPORTES', true),
    (10, 7, 'PUM', 'ASL', timestamptz '2026-09-27 12:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (10, 8, 'LEO', 'JUA', timestamptz '2026-09-27 19:00:00-06', 'NOU CAMP', true),
    (10, 9, 'NEC', 'AME', timestamptz '2026-09-27 21:00:00-06', 'VICTORIA', true),
    (11, 1, 'QRO', 'ATN', timestamptz '2026-10-09 19:00:00-06', 'LA CORREGIDORA', true),
    (11, 2, 'PUE', 'LEO', timestamptz '2026-10-09 19:00:00-06', 'CUAUHTÉMOC', true),
    (11, 3, 'TIG', 'TOL', timestamptz '2026-10-09 21:00:00-06', 'UNIVERSITARIO', true),
    (11, 4, 'JUA', 'TIJ', timestamptz '2026-10-10 17:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (11, 5, 'ATS', 'GDL', timestamptz '2026-10-10 19:00:00-06', 'JALISCO', true),
    (11, 6, 'AME', 'MTY', timestamptz '2026-10-10 21:00:00-06', 'BANORTE', true),
    (11, 7, 'PAC', 'NEC', timestamptz '2026-10-11 17:00:00-06', 'HIDALGO', true),
    (11, 8, 'ASL', 'SAN', timestamptz '2026-10-11 17:00:00-06', 'LIBERTAD FINANCIERA', true),
    (11, 9, 'PUM', 'CAZ', timestamptz '2026-10-11 19:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (12, 1, 'NEC', 'ATS', timestamptz '2026-10-16 19:00:00-06', 'VICTORIA', true),
    (12, 2, 'ATN', 'PUM', timestamptz '2026-10-16 21:00:00-06', 'BANORTE', true),
    (12, 3, 'TIJ', 'PUE', timestamptz '2026-10-16 21:00:00-06', 'CALIENTE', true),
    (12, 4, 'GDL', 'TIG', timestamptz '2026-10-17 17:00:00-06', 'AKRON', true),
    (12, 5, 'SAN', 'QRO', timestamptz '2026-10-17 17:00:00-06', 'TSM CORONA', true),
    (12, 6, 'LEO', 'AME', timestamptz '2026-10-17 19:00:00-06', 'NOU CAMP', true),
    (12, 7, 'TOL', 'ASL', timestamptz '2026-10-17 19:00:00-06', 'NEMESIO DIEZ', true),
    (12, 8, 'CAZ', 'JUA', timestamptz '2026-10-17 21:00:00-06', 'CD. DE LOS DEPORTES', true),
    (12, 9, 'MTY', 'PAC', timestamptz '2026-10-18 19:00:00-06', 'BBVA', true),
    (13, 1, 'ASL', 'QRO', timestamptz '2026-10-20 19:00:00-06', 'LIBERTAD FINANCIERA', true),
    (13, 2, 'JUA', 'ATN', timestamptz '2026-10-20 19:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (13, 3, 'TIG', 'LEO', timestamptz '2026-10-20 21:00:00-06', 'UNIVERSITARIO', true),
    (13, 4, 'GDL', 'NEC', timestamptz '2026-10-20 21:00:00-06', 'AKRON', true),
    (13, 5, 'PUE', 'MTY', timestamptz '2026-10-21 19:00:00-06', 'CUAUHTÉMOC', true),
    (13, 6, 'ATS', 'AME', timestamptz '2026-10-21 19:00:00-06', 'JALISCO', true),
    (13, 7, 'TOL', 'TIJ', timestamptz '2026-10-21 19:00:00-06', 'NEMESIO DIEZ', true),
    (13, 8, 'PAC', 'CAZ', timestamptz '2026-10-21 21:00:00-06', 'HIDALGO', true),
    (13, 9, 'SAN', 'PUM', timestamptz '2026-10-21 21:00:00-06', 'TSM CORONA', true),
    (14, 1, 'NEC', 'JUA', timestamptz '2026-10-23 19:00:00-06', 'VICTORIA', true),
    (14, 2, 'ATN', 'ASL', timestamptz '2026-10-23 21:00:00-06', 'BANORTE', true),
    (14, 3, 'LEO', 'TOL', timestamptz '2026-10-24 17:00:00-06', 'NOU CAMP', true),
    (14, 4, 'MTY', 'GDL', timestamptz '2026-10-24 19:00:00-06', 'BBVA', true),
    (14, 5, 'PUM', 'TIG', timestamptz '2026-10-24 21:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (14, 6, 'ATS', 'PUE', timestamptz '2026-10-25 17:00:00-06', 'JALISCO', true),
    (14, 7, 'AME', 'PAC', timestamptz '2026-10-25 17:00:00-06', 'BANORTE', true),
    (14, 8, 'QRO', 'CAZ', timestamptz '2026-10-25 19:00:00-06', 'LA CORREGIDORA', true),
    (14, 9, 'TIJ', 'SAN', timestamptz '2026-10-25 21:00:00-06', 'CALIENTE', true),
    (15, 1, 'ASL', 'ATS', timestamptz '2026-10-30 19:00:00-06', 'LIBERTAD FINANCIERA', true),
    (15, 2, 'JUA', 'QRO', timestamptz '2026-10-30 19:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (15, 3, 'PUE', 'PUM', timestamptz '2026-10-30 21:00:00-06', 'CUAUHTÉMOC', true),
    (15, 4, 'PAC', 'TIG', timestamptz '2026-10-31 17:00:00-06', 'HIDALGO', true),
    (15, 5, 'GDL', 'ATN', timestamptz '2026-10-31 19:00:00-06', 'AKRON', true),
    (15, 6, 'MTY', 'TIJ', timestamptz '2026-10-31 19:00:00-06', 'BBVA', true),
    (15, 7, 'AME', 'TOL', timestamptz '2026-10-31 21:00:00-06', 'BANORTE', true),
    (15, 8, 'SAN', 'NEC', timestamptz '2026-11-01 17:00:00-06', 'TSM CORONA', true),
    (15, 9, 'CAZ', 'LEO', timestamptz '2026-11-01 19:00:00-06', 'CD. DE LOS DEPORTES', true),
    (16, 1, 'ASL', 'JUA', timestamptz '2026-11-06 19:00:00-06', 'LIBERTAD FINANCIERA', true),
    (16, 2, 'NEC', 'TIJ', timestamptz '2026-11-06 19:00:00-06', 'VICTORIA', true),
    (16, 3, 'ATN', 'SAN', timestamptz '2026-11-06 21:00:00-06', 'BANORTE', true),
    (16, 4, 'ATS', 'PAC', timestamptz '2026-11-07 17:00:00-06', 'JALISCO', true),
    (16, 5, 'TIG', 'CAZ', timestamptz '2026-11-07 17:00:00-06', 'UNIVERSITARIO', true),
    (16, 6, 'TOL', 'MTY', timestamptz '2026-11-07 19:00:00-06', 'NEMESIO DIEZ', true),
    (16, 7, 'PUM', 'AME', timestamptz '2026-11-07 21:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (16, 8, 'QRO', 'PUE', timestamptz '2026-11-08 18:00:00-06', 'LA CORREGIDORA', true),
    (16, 9, 'LEO', 'GDL', timestamptz '2026-11-08 20:00:00-06', 'NOU CAMP', true),
    (17, 1, 'PUE', 'ASL', timestamptz '2026-11-20 19:00:00-06', 'CUAUHTÉMOC', true),
    (17, 2, 'JUA', 'ATS', timestamptz '2026-11-20 21:00:00-06', 'OLÍMPICO BENITO JUÁREZ', true),
    (17, 3, 'TIJ', 'ATN', timestamptz '2026-11-20 21:00:00-06', 'CALIENTE', true),
    (17, 4, 'SAN', 'LEO', timestamptz '2026-11-21 17:00:00-06', 'TSM CORONA', true),
    (17, 5, 'PAC', 'TOL', timestamptz '2026-11-21 17:00:00-06', 'HIDALGO', true),
    (17, 6, 'PUM', 'MTY', timestamptz '2026-11-21 19:00:00-06', 'OLÍMPICO UNIVERSITARIO', true),
    (17, 7, 'TIG', 'AME', timestamptz '2026-11-21 21:00:00-06', 'UNIVERSITARIO', true),
    (17, 8, 'GDL', 'CAZ', timestamptz '2026-11-22 17:00:00-06', 'AKRON', true),
    (17, 9, 'QRO', 'NEC', timestamptz '2026-11-22 19:00:00-06', 'LA CORREGIDORA', true)
), competition as (
  select id from public.competitions where slug = 'liga-mx-apertura-2026'
), team_broadcast (code, channels) as (
  -- Canal por defecto del partido según los derechos de TV del equipo local
  -- (prensa mexicana, Apertura 2026). Necaxa, Puebla, Tigres, FC Juárez, Atlante
  -- y Toluca reparten sus partidos entre varias señales jornada a jornada: estos
  -- valores son el caso más común y se pueden corregir por partido si hace falta.
  values
    ('AME', 'canal5,tudn'),
    ('ATN', 'fox,azteca'),
    ('ATS', 'canal5,tudn'),
    ('ASL', 'espn,vix'),
    ('TIJ', 'fox'),
    ('CAZ', 'canal5,tudn'),
    ('JUA', 'azteca,fox'),
    ('QRO', 'fox'),
    ('GDL', 'prime'),
    ('LEO', 'fox'),
    ('NEC', 'fox,azteca'),
    ('PAC', 'fox'),
    ('PUE', 'azteca,fox'),
    ('MTY', 'canal5,tudn'),
    ('SAN', 'canal5,tudn'),
    ('TIG', 'azteca,fox'),
    ('TOL', 'canal5,azteca'),
    ('PUM', 'canal5,tudn')
)
insert into public.matches (
  id, competition_id, home_team_id, away_team_id, home_score, away_score,
  status, phase, match_date, venue, broadcast_channel
)
select
  md5('liga-mx-apertura-2026-match-' || f.round_number || '-' || f.position)::uuid,
  c.id,
  home_team.id,
  away_team.id,
  0,
  0,
  'scheduled'::match_status,
  case when f.kickoff_confirmed then 'Jornada ' || f.round_number else 'Jornada ' || f.round_number || ' · horario por confirmar' end,
  f.kickoff,
  f.venue,
  tb.channels
from fixture_values f
cross join competition c
join public.teams home_team on home_team.code = f.home_code
join public.teams away_team on away_team.code = f.away_code
left join team_broadcast tb on tb.code = f.home_code
on conflict (id) do update
set competition_id = excluded.competition_id,
    home_team_id = excluded.home_team_id,
    away_team_id = excluded.away_team_id,
    phase = excluded.phase,
    match_date = excluded.match_date,
    venue = excluded.venue,
    broadcast_channel = excluded.broadcast_channel;

with positions (round_number, position) as (
  values
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 5),
    (1, 6),
    (1, 7),
    (1, 8),
    (1, 9),
    (2, 1),
    (2, 2),
    (2, 3),
    (2, 4),
    (2, 5),
    (2, 6),
    (2, 7),
    (2, 8),
    (2, 9),
    (3, 1),
    (3, 2),
    (3, 3),
    (3, 4),
    (3, 5),
    (3, 6),
    (3, 7),
    (3, 8),
    (3, 9),
    (4, 1),
    (4, 2),
    (4, 3),
    (4, 4),
    (4, 5),
    (4, 6),
    (4, 7),
    (4, 8),
    (4, 9),
    (5, 1),
    (5, 2),
    (5, 3),
    (5, 4),
    (5, 5),
    (5, 6),
    (5, 7),
    (5, 8),
    (5, 9),
    (6, 1),
    (6, 2),
    (6, 3),
    (6, 4),
    (6, 5),
    (6, 6),
    (6, 7),
    (6, 8),
    (6, 9),
    (7, 1),
    (7, 2),
    (7, 3),
    (7, 4),
    (7, 5),
    (7, 6),
    (7, 7),
    (7, 8),
    (7, 9),
    (8, 1),
    (8, 2),
    (8, 3),
    (8, 4),
    (8, 5),
    (8, 6),
    (8, 7),
    (8, 8),
    (8, 9),
    (9, 1),
    (9, 2),
    (9, 3),
    (9, 4),
    (9, 5),
    (9, 6),
    (9, 7),
    (9, 8),
    (9, 9),
    (10, 1),
    (10, 2),
    (10, 3),
    (10, 4),
    (10, 5),
    (10, 6),
    (10, 7),
    (10, 8),
    (10, 9),
    (11, 1),
    (11, 2),
    (11, 3),
    (11, 4),
    (11, 5),
    (11, 6),
    (11, 7),
    (11, 8),
    (11, 9),
    (12, 1),
    (12, 2),
    (12, 3),
    (12, 4),
    (12, 5),
    (12, 6),
    (12, 7),
    (12, 8),
    (12, 9),
    (13, 1),
    (13, 2),
    (13, 3),
    (13, 4),
    (13, 5),
    (13, 6),
    (13, 7),
    (13, 8),
    (13, 9),
    (14, 1),
    (14, 2),
    (14, 3),
    (14, 4),
    (14, 5),
    (14, 6),
    (14, 7),
    (14, 8),
    (14, 9),
    (15, 1),
    (15, 2),
    (15, 3),
    (15, 4),
    (15, 5),
    (15, 6),
    (15, 7),
    (15, 8),
    (15, 9),
    (16, 1),
    (16, 2),
    (16, 3),
    (16, 4),
    (16, 5),
    (16, 6),
    (16, 7),
    (16, 8),
    (16, 9),
    (17, 1),
    (17, 2),
    (17, 3),
    (17, 4),
    (17, 5),
    (17, 6),
    (17, 7),
    (17, 8),
    (17, 9)
), competition as (
  select id from public.competitions where slug = 'liga-mx-apertura-2026'
)
insert into public.base_quiniela_round_matches (id, round_id, match_id, position)
select
  md5('liga-mx-apertura-2026-link-' || p.round_number || '-' || p.position)::uuid,
  r.id,
  md5('liga-mx-apertura-2026-match-' || p.round_number || '-' || p.position)::uuid,
  p.position
from positions p
cross join competition c
join public.base_quiniela_rounds r
  on r.competition_id = c.id
 and r.round_number = p.round_number
on conflict (round_id, position) do update
set match_id = excluded.match_id;

do $$
begin
  if (select count(*) from public.base_quiniela_rounds r join public.competitions c on c.id = r.competition_id where c.slug = 'liga-mx-apertura-2026') <> 17 then
    raise exception 'Se esperaban 17 jornadas de Liga MX';
  end if;
  if exists (
    select r.id
    from public.base_quiniela_rounds r
    join public.competitions c on c.id = r.competition_id
    left join public.base_quiniela_round_matches rm on rm.round_id = r.id
    where c.slug = 'liga-mx-apertura-2026'
    group by r.id
    having count(rm.id) <> 9
  ) then
    raise exception 'Cada jornada debe contener exactamente 9 partidos';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;

-- Verificación:
-- select r.round_number, count(rm.id) as partidos
-- from public.base_quiniela_rounds r
-- join public.competitions c on c.id = r.competition_id
-- left join public.base_quiniela_round_matches rm on rm.round_id = r.id
-- where c.slug = 'liga-mx-apertura-2026'
-- group by r.id, r.round_number
-- order by r.round_number;
