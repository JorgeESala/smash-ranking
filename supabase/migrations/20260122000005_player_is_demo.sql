-- ============================================================================
-- yoshos-ranking — migration 0005
-- Add is_demo column to players so /leaderboard can filter out the
-- seeded fictional roster, and /season/demo can show all players.
-- ============================================================================

alter table players
  add column if not exists is_demo boolean not null default false;

-- Mark players created by the demo seed. The seed's auth.users rows have
-- a recognizable email pattern (`demo+<nickname>@yoshos.invalid`).
update players p
set is_demo = true
where p.auth_user_id in (
  select id from auth.users
  where email like 'demo+%@yoshos.invalid'
);

-- Index for the common `where is_demo = false` filter on /leaderboard.
-- Partial index keeps it small since most rows will be is_demo = false.
create index if not exists players_is_demo_idx
  on players (is_demo, current_elo desc)
  where is_demo = false;
