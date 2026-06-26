import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { MatchCard } from "@/components/match/match-card";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Temporada demo" };

export default async function DemoSeasonPage() {
  const supabase = await createClient();

  // We don't actually use the demo season row to filter matches anymore
  // (the demo page is the "see everything" view), but we still need its
  // id to filter it out of /matches and elsewhere. Keeping the lookup
  // here in case future code wants to show demo-season-only stats.
  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, starts_at, ends_at")
    .eq("is_demo", true)
    .maybeSingle();

  // Show ALL players (demo + real) so visitors can see how the app
  // behaves when it's populated with real data alongside the seeded
  // fictional roster. Demo players sort first so the contrast is
  // visually obvious.
  const { data: players } = await supabase
    .from("players")
    .select("id, nickname, avatar_url, current_elo, games_played, wins, losses, is_demo")
    .order("is_demo", { ascending: false })
    .order("current_elo", { ascending: false });

  // Show ALL approved matches from all seasons. The demo page is the
  // "see everything" surface, so demo matches and real matches mix.
  // Cast is a Supabase TS workaround for joined selects with extra
  // filters; runtime query is correct.
  const { data: matches } = (await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, " +
        "reporter:players!reporter_id(nickname,avatar_url), " +
        "opponent:players!opponent_id(nickname,avatar_url), " +
        "winner:players!winner_id(nickname)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50)) as unknown as { data: Array<{
      id: string;
      winner_score: number;
      loser_score: number;
      format: string;
      created_at: string;
      reporter: { nickname: string; avatar_url: string | null } | null;
      opponent: { nickname: string; avatar_url: string | null } | null;
      winner: { nickname: string } | null;
    }> | null };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex items-start gap-3">
        <Sparkles className="mt-1 size-7 text-secondary" />
        <div>
          <h1 className="font-mono text-3xl font-bold">Temporada demo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista combinada: jugadores demo + jugadores reales, partidas
            demo + partidas reales. El ranking en vivo está en{" "}
            <a href="/leaderboard" className="text-primary hover:underline">
              /leaderboard
            </a>
            .
          </p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-xl font-bold">Leaderboard</h2>
        {players && players.length > 0 ? (
          <LeaderboardTable players={players} showDemoBadge />
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos aún.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xl font-bold">Partidas</h2>
        {matches && matches.length > 0 ? (
          <div className="space-y-2">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m as never} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin partidas aún.</p>
        )}
      </section>
    </main>
  );
}
