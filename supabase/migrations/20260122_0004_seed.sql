-- ============================================================================
-- Demo season seed — 8 fictional Smash-flavored players, ~30 matches.
-- This is the "always rendered, never empty" data for /season/demo and
-- the resume showcase. Real players are added by the invite-code flow.
--
-- Run AFTER 0001, 0002, 0003. Idempotent: re-running won't double-seed.
-- ============================================================================

do $$
declare
  demo_season_id uuid;
  p record;
  nicknames text[] := array[
    'Pikachu_PR',
    'FoxOnly',
    'Captain_Stack',
    'JigglyBoom',
    'SheikMain',
    'MarthBest',
    'Falco_Prime',
    'PeachFloat',
  ];
  player_ids uuid[] := array[]::uuid[];
  ava_elo int;
  ava_games int;
  w int; l int;
  fmt match_format;
  match_winner_id uuid;
  match_loser_id uuid;
  winner_score int;
  loser_score int;
  format_choices match_format[] := array['bo5','bo5','bo5','bo3','first_to_5']::match_format[];
  i int;
begin
  -- Idempotency guard
  if exists (select 1 from seasons where is_demo = true) then
    raise notice 'Demo season already seeded; skipping';
    return;
  end if;

  -- Demo season row
  insert into seasons (name, is_demo, is_active, starts_at, ends_at)
  values ('Temporada Demo', true, false, now() - interval '90 days', now())
  returning id into demo_season_id;

  -- Create 8 fake player rows. These reference fake auth.users IDs because
  -- they don't need to log in. We pre-create the auth.users rows via a
  -- service-role-only path; on hosted Supabase, run this as a superuser.
  for i in 1..array_length(nicknames, 1) loop
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      format('demo+%s@yoshos.invalid', replace(nicknames[i], '_', '-')),
      '',
      now(),
      jsonb_build_object('provider','email','providers', array['email']),
      jsonb_build_object('is_demo', true, 'nickname', nicknames[i]),
      now(), now(), '', '', '', ''
    );

    insert into players (auth_user_id, nickname, current_elo, peak_elo, games_played, wins, losses, last_seen_at)
    values (
      (select id from auth.users where email = format('demo+%s@yoshos.invalid', replace(nicknames[i], '_', '-'))),
      nicknames[i],
      1200, 1200, 0, 0, 0, now() - (random() * interval '7 days')
    )
    returning id into p;

    player_ids := array_append(player_ids, p.id);
  end loop;

  -- Generate ~30 matches across the 8 players with realistic Elo movements.
  for i in 1..32 loop
    -- Pick two distinct players
    declare p1 int; p2 int;
    begin
      p1 := 1 + floor(random() * array_length(player_ids, 1))::int;
      p2 := 1 + floor(random() * array_length(player_ids, 1))::int;
      while p2 = p1 loop
        p2 := 1 + floor(random() * array_length(player_ids, 1))::int;
      end loop;

      -- Slight Elo bias toward higher-ranked player
      select current_elo, games_played into ava_elo, ava_games from players where id = player_ids[p1];
      -- 50/50 winner selection, no Elo bias in seed (deterministic feel)
      if random() < 0.5 then
        match_winner_id := player_ids[p1];
        match_loser_id  := player_ids[p2];
      else
        match_winner_id := player_ids[p2];
        match_loser_id  := player_ids[p1];
      end if;

      fmt := format_choices[1 + floor(random() * array_length(format_choices, 1))::int];
      if fmt = 'bo3' then
        if random() < 0.4 then winner_score := 2; loser_score := 0; else winner_score := 2; loser_score := 1; end if;
      elsif fmt = 'bo5' then
        winner_score := 3;
        loser_score := floor(random() * 3)::int;
      else
        winner_score := 5;
        loser_score := floor(random() * 5)::int;
      end if;

      -- Insert match as 'approved' with realistic timestamps
      insert into matches (
        season_id, reporter_id, opponent_id, winner_id,
        winner_score, loser_score, format, status,
        created_at, resolved_at
      ) values (
        demo_season_id, match_winner_id, match_loser_id, match_winner_id,
        winner_score, loser_score, fmt, 'approved',
        now() - (random() * interval '80 days'),
        now() - (random() * interval '80 days') + interval '1 hour'
      );

      -- Bump Elo naively in seed (small drift, doesn't need to be accurate)
      update players set
        current_elo = current_elo + (case when random() < 0.5 then 12 + floor(random()*8) else -(8 + floor(random()*8)) end),
        peak_elo = greatest(peak_elo, current_elo),
        games_played = games_played + 1,
        wins = wins + (case when match_winner_id = id then 1 else 0 end),
        losses = losses + (case when match_loser_id = id then 1 else 0 end)
      where id in (match_winner_id, match_loser_id);
    end;
  end loop;

  raise notice 'Demo season seeded with % players and 32 matches', array_length(player_ids, 1);
end $$;
