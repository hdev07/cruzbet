-- Día 4: scoring de predicciones
-- Ejecutar después de predictions_schema.sql

alter table predictions
  add column if not exists scored_at timestamptz;

create table if not exists match_goal_events (
  id bigint generated always as identity primary key,
  match_id bigint not null,
  goal_minute integer not null,
  goal_team text not null check (goal_team in ('home', 'away')),
  processed_at timestamptz default now(),
  unique (match_id, goal_minute, goal_team)
);

create index if not exists match_goal_events_match_id_idx on match_goal_events(match_id);

alter table match_goal_events enable row level security;

drop policy if exists "match_goal_events_select" on match_goal_events;
create policy "match_goal_events_select" on match_goal_events
  for select to anon, authenticated
  using (true);

grant select on match_goal_events to anon, authenticated;
