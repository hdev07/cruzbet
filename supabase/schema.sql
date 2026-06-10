-- Paso 6-9: ejecutar en SQL Editor de Supabase

-- Equipos
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code char(3) not null unique,
  flag_url text,
  group_name char(1),
  created_at timestamptz default now()
);

-- Partidos
do $$ begin
  create type match_status as enum ('scheduled', 'live', 'finished');
exception
  when duplicate_object then null;
end $$;

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  home_score int default 0,
  away_score int default 0,
  status match_status default 'scheduled',
  phase text,
  match_date timestamptz,
  venue text,
  created_at timestamptz default now()
);

-- Jugadores
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  name text not null,
  number int,
  position text,
  created_at timestamptz default now()
);

create index if not exists matches_status_idx on matches(status);
create index if not exists matches_match_date_idx on matches(match_date);

-- Paso 7: eventos polimórficos
do $$ begin
  create type event_type as enum (
    'goal',
    'corner',
    'card',
    'offside',
    'penalty',
    'substitution',
    'var_review'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  team_id uuid references teams(id),
  player_id uuid references players(id),
  event_type event_type not null,
  minute int not null,
  extra_time int default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists match_events_match_id_idx on match_events(match_id);
create index if not exists match_events_event_type_idx on match_events(event_type);

-- Paso 8: RLS
alter table teams enable row level security;
alter table matches enable row level security;
alter table players enable row level security;
alter table match_events enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read events" on match_events for select using (true);

create policy "admin write matches" on matches
  for all using (auth.jwt() ->> 'role' = 'admin');

create policy "admin write events" on match_events
  for all using (auth.jwt() ->> 'role' = 'admin');

create policy "admin write teams" on teams
  for all using (auth.jwt() ->> 'role' = 'admin');

create policy "admin write players" on players
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Paso 9: Realtime
alter table match_events replica identity full;
alter table matches replica identity full;

alter publication supabase_realtime add table match_events;
alter publication supabase_realtime add table matches;
