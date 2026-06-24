-- ============================================================================
-- Row-level security
-- ============================================================================

alter table seasons          enable row level security;
alter table players          enable row level security;
alter table matches          enable row level security;
alter table match_actions    enable row level security;
alter table push_subs        enable row level security;
alter table player_season_summaries enable row level security;

-- Helper: get the player row for the current auth.uid()
create or replace function current_player_id() returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from players where auth_user_id = auth.uid()
$$;

-- Drop existing policies so this migration is idempotent ---------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('seasons','players','matches','match_actions','push_subs','player_season_summaries')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Seasons: public read --------------------------------------------------------
create policy seasons_read on seasons for select using (true);

-- Players: public read; only the player themselves can update -----------------
create policy players_read on players for select using (true);
create policy players_update_self on players for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Matches: public read for approved; member read for their own pending -------
create policy matches_read_public on matches for select
  using (status = 'approved');
create policy matches_read_member on matches for select
  using (
    auth.uid() is not null
    and (reporter_id = current_player_id() or opponent_id = current_player_id())
  );
create policy matches_insert_reporter on matches for insert
  with check (
    auth.uid() is not null
    and reporter_id = current_player_id()
    and (winner_id = reporter_id or winner_id = opponent_id)
  );

-- Match actions: only the non-reporter can approve/dispute; reporter can cancel
create policy match_actions_insert on match_actions for insert
  with check (
    actor_id = current_player_id()
    and (
      (action = 'cancel' and exists (
        select 1 from matches m
        where m.id = match_id
          and m.reporter_id = current_player_id()
          and m.status = 'pending'
      ))
      or
      ((action in ('approve','dispute')) and exists (
        select 1 from matches m
        where m.id = match_id
          and m.opponent_id = current_player_id()
          and m.reporter_id <> current_player_id()
          and m.status = 'pending'
      ))
    )
  );
create policy match_actions_read_self on match_actions for select
  using (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (m.reporter_id = current_player_id() or m.opponent_id = current_player_id())
    )
  );

-- Push subs: owner-only -------------------------------------------------------
create policy push_subs_self on push_subs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Season summaries: public read -----------------------------------------------
create policy summaries_read on player_season_summaries for select using (true);

-- Storage: avatar bucket policies ---------------------------------------------
-- Public read on avatars; only owner can write/update/delete their own folder.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('avatars_read','avatars_insert_own','avatars_update_own','avatars_delete_own')
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy avatars_read on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );

create policy avatars_delete_own on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );
