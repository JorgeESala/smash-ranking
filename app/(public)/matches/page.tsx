import { createClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/match/match-card";

export const metadata = { title: "Partidas" };

// Sentinel UUID used when no demo season exists. The `.neq` filter
// against this value is a no-op (no real match has this id) so we
// can apply the filter unconditionally and keep the query chain simple.
const NO_DEMO_SENTINEL = "00000000-0000-0000-0000-000000000000";

export default async function MatchesPage() {
  const supabase = await createClient();

  // Find the demo season so we can exclude its matches. The demo roster
  // is meant for the /season/demo showcase, not the live activity feed.
  const { data: demoSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_demo", true)
    .maybeSingle();

  // The .neq filter on a column with joined selects trips Supabase's
  // type inference into a GenericStringError state. The query is correct
  // at runtime; the cast is purely a TS workaround.
  const { data: matches } = (await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, " +
        "reporter:players!reporter_id(nickname,avatar_url), " +
        "opponent:players!opponent_id(nickname,avatar_url), " +
        "winner:players!winner_id(nickname)",
    )
    .eq("status", "approved")
    .neq("season_id", demoSeason?.id ?? NO_DEMO_SENTINEL)
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-mono text-3xl font-bold">Partidas aprobadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las últimas 50 partidas de la temporada activa.
        </p>
      </header>

      {matches && matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m as never} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-medium">Sin partidas aún</p>
        </div>
      )}
    </main>
  );
}
