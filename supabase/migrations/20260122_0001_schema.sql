-- ============================================================================
-- yoshos-ranking — initial schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type match_format as enum ('bo3', 'bo5', 'first_to_5');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('pending', 'approved', 'disputed', 'cancelled');
exception when duplicate_object then null; end $$;

-- Seasons --------------------------------------------------------------------
create table if not exists seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  is_active   boolean not null default false,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index if not exists seasons_one_active on seasons (is_active) where is_active;
create unique index if not exists seasons_one_demo on seasons (is_demo) where is_demo;

-- Players --------------------------------------------------------------------
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   uuid not null unique references auth.users(id) on delete cascade,
  nickname       text not null unique check (char_length(nickname) between 2 and 24),
  avatar_url     text,
  current_elo    integer not null default 1200,
  peak_elo       integer not null default 1200,
  games_played   integer not null default 0,
  wins           integer not null default 0,
  losses         integer not null default 0,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);
create index if not exists players_elo_desc on players (current_elo desc);

-- Matches --------------------------------------------------------------------
create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references seasons(id) on delete restrict,
  reporter_id    uuid not null references players(id) on delete restrict,
  opponent_id    uuid not null references players(id) on delete restrict,
  winner_id      uuid not null references players(id) on delete restrict,
  winner_score   smallint not null check (winner_score >= 0),
  loser_score    smallint not null check (loser_score >= 0),
  format         match_format not null default 'bo5',
  status         match_status not null default 'pending',
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz,
  constraint matches_distinct_players check (reporter_id <> opponent_id),
  constraint matches_winner_is_player check (winner_id in (reporter_id, opponent_id)),
  constraint matches_winner_beats_loser check (winner_score > loser_score)
);
create index if not exists matches_season_status on matches (season_id, status, created_at desc);
create index if not exists matches_reporter_status on matches (reporter_id, status);
create index if not exists matches_opponent_status on matches (opponent_id, status);

-- Match actions (approve/dispute/cancel) -------------------------------------
create table if not exists match_actions (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references matches(id) on delete cascade,
  actor_id     uuid not null references players(id) on delete restrict,
  action       text not null check (action in ('approve', 'dispute', 'cancel')),
  reason       text,
  created_at   timestamptz not null default now(),
  unique (match_id, action, actor_id)
);
create index if not exists match_actions_match on match_actions (match_id, created_at desc);

-- Push subscriptions ---------------------------------------------------------
create table if not exists push_subs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz not null default now()
);
create index if not exists push_subs_user on push_subs (user_id);

-- Season summaries (filled when a season ends) ------------------------------
create table if not exists player_season_summaries (
  player_id   uuid not null references players(id) on delete cascade,
  season_id   uuid not null references seasons(id) on delete cascade,
  final_elo   integer not null,
  games       integer not null,
  wins        integer not null,
  losses      integer not null,
  rank        integer,
  primary key (player_id, season_id)
);
create index if not exists summaries_season on player_season_summaries (season_id, rank);

-- Avatar storage bucket ------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
