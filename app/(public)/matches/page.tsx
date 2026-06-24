import { createClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/match/match-card";

export const metadata = { title: "Partidas" };

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, reporter:players!reporter_id(nickname,avatar_url), opponent:players!opponent_id(nickname,avatar_url), winner:players!winner_id(nickname)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

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
