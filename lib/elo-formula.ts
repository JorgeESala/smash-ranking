// Pure functions for Elo math — used both by the client preview and any
// future server-side helper. The authoritative calculation lives in the
// approve_match() Postgres function (see supabase/migrations/0003).

export function expected_score(eloA: number, eloB: number): number {
  return 1.0 / (1.0 + Math.pow(10, (eloB - eloA) / 400));
}

export function k_factor(gamesPlayed: number): number {
  return gamesPlayed < 30 ? 40 : 32;
}
