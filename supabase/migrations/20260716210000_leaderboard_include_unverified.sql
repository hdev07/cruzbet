-- Incluir quinielas completas con pago no verificado en el leaderboard público.
-- El pozo / ganador oficial se filtra en la app con verified = true.

begin;

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
  (count(*) = r.match_count) as is_complete,
  coalesce(brp.verified, false) as verified,
  brp.verified_at,
  brp.submitted_at
from public.base_predictions bp
join public.profiles p on p.id = bp.user_id
join public.base_quiniela_rounds r on r.id = bp.round_id
inner join public.base_round_payments brp
  on brp.user_id = bp.user_id
  and brp.round_id = bp.round_id
  and brp.entry_number = bp.entry_number
group by
  bp.round_id,
  bp.user_id,
  bp.entry_number,
  p.username,
  p.avatar,
  r.match_count,
  brp.verified,
  brp.verified_at,
  brp.submitted_at;

grant select on public.base_round_leaderboard to anon, authenticated;

commit;
