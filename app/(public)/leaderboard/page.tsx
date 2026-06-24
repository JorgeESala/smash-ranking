import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";

export const metadata = { title: "Ranking" };

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("id, nickname, avatar_url, current_elo, games_played, wins, losses")
    .order("current_elo", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-mono text-3xl font-bold">Ranking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Temporada activa. Top 100 jugadores por Elo.
        </p>
      </header>

      {players && players.length > 0 ? (
        <LeaderboardTable players={players} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-medium">Aún no hay jugadores</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sé el primero en unirte.
          </p>
        </div>
      )}
    </main>
  );
}
