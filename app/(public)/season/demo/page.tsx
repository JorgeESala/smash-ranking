import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { MatchCard } from "@/components/match/match-card";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Temporada demo" };

export default async function DemoSeasonPage() {
  const supabase = await createClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, starts_at, ends_at")
    .eq("is_demo", true)
    .maybeSingle();

  // Demo players are tagged in user_metadata (we don't have a column, so
  // we identify them by the yoshos.invalid email pattern via auth.users
  // join). For simplicity we list all players whose nickname matches the
  // demo set; in a real app we'd add an `is_demo` column on players.
  const demoNicknames = [
    "Pikachu_PR",
    "FoxOnly",
    "Captain_Stack",
    "JigglyBoom",
    "SheikMain",
    "MarthBest",
    "Falco_Prime",
    "PeachFloat",
  ];
  const { data: players } = await supabase
    .from("players")
    .select("id, nickname, avatar_url, current_elo, games_played, wins, losses")
    .in("nickname", demoNicknames)
    .order("current_elo", { ascending: false });

  const { data: matches } = season
    ? await supabase
        .from("matches")
        .select(
          "id, winner_score, loser_score, format, created_at, reporter:players!reporter_id(nickname,avatar_url), opponent:players!opponent_id(nickname,avatar_url), winner:players!winner_id(nickname)",
        )
        .eq("season_id", season.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: null };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex items-start gap-3">
        <Sparkles className="mt-1 size-7 text-secondary" />
        <div>
          <h1 className="font-mono text-3xl font-bold">Temporada demo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Datos ficticios para que veas cómo luce una temporada activa. La
            temporada real se muestra en{" "}
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
          <LeaderboardTable players={players} />
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
