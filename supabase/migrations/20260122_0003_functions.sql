-- ============================================================================
-- Helper functions: format validation, Elo, season management
-- ============================================================================

-- Validate match scores for a given format. Returns error text, or null if OK.
create or replace function validate_match_scores(
  p_format match_format, p_winner int, p_loser int
) returns text language plpgsql immutable as $$
begin
  if p_winner <= p_loser then
    return 'El puntaje del ganador debe ser mayor';
  end if;
  case p_format
    when 'bo3' then
      if p_winner <> 2 or p_loser not in (0, 1) then
        return 'Mejor de 3: ganador 2, perdedor 0 o 1';
      end if;
    when 'bo5' then
      if p_winner <> 3 or p_loser not in (0, 1, 2) then
        return 'Mejor de 5: ganador 3, perdedor 0, 1 o 2';
      end if;
    when 'first_to_5' then
      if p_winner <> 5 or p_loser not in (0, 1, 2, 3, 4) then
        return 'Primero en 5: ganador 5, perdedor 0 a 4';
      end if;
  end case;
  return null;
end $$;

-- Expected score (probability of A winning, 0..1)
create or replace function expected_score(elo_a int, elo_b int)
returns double precision language sql immutable as $$
  select 1.0 / (1.0 + power(10.0, (elo_b - elo_a) / 400.0))
$$;

-- K-factor: 40 for the first 30 games per player, else 32
create or replace function k_factor(games_played int) returns int
language sql immutable as $$
  select case when games_played < 30 then 40 else 32 end
$$;

-- Approve a pending match: update Elo + stats transactionally.
-- Only callable by the opponent. SECURITY DEFINER so the RLS check passes.
create or replace function approve_match(p_match_id uuid) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  m matches;
  w_elo int; l_elo int;
  w_games int; l_games int;
  w_k int; l_k int;
  w_exp double precision; l_exp double precision;
  w_new int; l_new int;
begin
  select * into m from matches where id = p_match_id for update;
  if m.id is null then raise exception 'Partida no encontrada'; end if;
  if m.status <> 'pending' then raise exception 'La partida no está pendiente'; end if;

  -- Opponent must be the actor
  if m.opponent_id <> current_player_id() then
    raise exception 'Solo el oponente puede aprobar';
  end if;

  -- Read current Elos + games
  select current_elo, games_played into w_elo, w_games from players where id = m.winner_id;
  select current_elo, games_played into l_elo, l_games
    from players
    where id = case when m.winner_id = m.reporter_id then m.opponent_id else m.reporter_id end;
  if w_elo is null or l_elo is null then
    raise exception 'Jugadores no encontrados';
  end if;

  -- K factors
  w_k := k_factor(w_games);
  l_k := k_factor(l_games);

  -- Expected scores
  w_exp := expected_score(w_elo, l_elo);
  l_exp := expected_score(l_elo, w_elo);

  -- New Elos (winner scored 1.0, loser 0.0)
  w_new := w_elo + round(w_k * (1.0 - w_exp))::int;
  l_new := l_elo + round(l_k * (0.0 - l_exp))::int;

  -- Update winner
  update players set
    current_elo = w_new,
    peak_elo = greatest(peak_elo, w_new),
    games_played = games_played + 1,
    wins = wins + 1,
    last_seen_at = now()
  where id = m.winner_id;

  -- Update loser
  update players set
    current_elo = l_new,
    games_played = games_played + 1,
    losses = losses + 1,
    last_seen_at = now()
  where id = case when m.winner_id = m.reporter_id then m.opponent_id else m.reporter_id end;

  -- Mark match approved
  update matches set status = 'approved', resolved_at = now() where id = m.id;

  -- Audit
  insert into match_actions (match_id, actor_id, action)
  values (m.id, current_player_id(), 'approve');

  return m.id;
end $$;

-- Record a dispute (no Elo change, status = disputed)
create or replace function record_dispute(p_match_id uuid, p_reason text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  m matches;
begin
  select * into m from matches where id = p_match_id for update;
  if m.id is null then raise exception 'Partida no encontrada'; end if;
  if m.status <> 'pending' then raise exception 'La partida no está pendiente'; end if;
  if m.opponent_id <> current_player_id() then
    raise exception 'Solo el oponente puede disputar';
  end if;

  update matches set status = 'disputed', resolved_at = now() where id = m.id;

  insert into match_actions (match_id, actor_id, action, reason)
  values (m.id, current_player_id(), 'dispute', p_reason);

  return m.id;
end $$;

-- Cancel a pending match (reporter can cancel their own)
create or replace function cancel_match(p_match_id uuid) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  m matches;
begin
  select * into m from matches where id = p_match_id for update;
  if m.id is null then raise exception 'Partida no encontrada'; end if;
  if m.status <> 'pending' then raise exception 'La partida no está pendiente'; end if;
  if m.reporter_id <> current_player_id() then
    raise exception 'Solo el reportero puede cancelar';
  end if;

  update matches set status = 'cancelled', resolved_at = now() where id = m.id;

  insert into match_actions (match_id, actor_id, action)
  values (m.id, current_player_id(), 'cancel');

  return m.id;
end $$;

-- End the current season: snapshot every player's elo into summaries,
-- deactivate the season, update peak_elo, then activate the next season.
create or replace function end_current_season() returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  cur seasons;
  p record;
  r int;
begin
  select * into cur from seasons where is_active = true for update;
  if cur.id is null then raise exception 'No hay temporada activa'; end if;

  -- Snapshot all players
  for p in
    select id, current_elo, games_played, wins, losses
    from players
    order by current_elo desc
  loop
    r := row_number() over (order by current_elo desc);
    insert into player_season_summaries (player_id, season_id, final_elo, games, wins, losses, rank)
    values (p.id, cur.id, p.current_elo, p.games_played, p.wins, p.losses, r)
    on conflict (player_id, season_id) do update set
      final_elo = excluded.final_elo,
      games     = excluded.games,
      wins      = excluded.wins,
      losses    = excluded.losses,
      rank      = excluded.rank;
  end loop;

  -- Close the season
  update seasons set is_active = false, ends_at = now() where id = cur.id;

  return cur.id;
end $$;

-- Start a new season and reset every player's elo to 1200.
-- Uses a separate SELECT to fetch the new id instead of `returning id into`
-- because the strict-form was triggering Postgres 21000 cardinality_violation
-- in some Supabase RPC contexts.
create or replace function start_new_season(p_name text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  new_id uuid;
begin
  if exists (select 1 from seasons where is_active = true) then
    raise exception 'Ya hay una temporada activa. Termínala primero.'
      using errcode = 'P0001';
  end if;

  insert into seasons (name, is_active) values (p_name, true);

  select id into new_id
  from seasons
  where is_active = true
  order by created_at desc
  limit 1;

  if new_id is null then
    raise exception 'No se pudo crear la temporada'
      using errcode = 'P0001';
  end if;

  update players set
    current_elo = 1200,
    games_played = 0,
    wins = 0,
    losses = 0;

  return new_id;
end $$;

-- Touch last_seen_at on every authenticated page load. Called from middleware.
create or replace function touch_player_last_seen() returns void
language sql security definer set search_path = public, auth as $$
  update players set last_seen_at = now() where auth_user_id = auth.uid()
$$;

-- Realtime: add tables to the supabase_realtime publication
-- (Supabase auto-handles this for new tables on hosted, but explicit is safer)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
exception when undefined_object then
  -- publication may not exist on all Supabase plans; ignore
  null;
end $$;
