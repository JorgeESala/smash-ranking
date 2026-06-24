import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/require-member";
import { ReportForm } from "./report-form";
import { Swords } from "lucide-react";

export const metadata = { title: "Reportar partida" };

export default async function ReportPage() {
  const ctx = await requireMember("/report");
  const supabase = await createClient();

  // Roster: everyone except me, ordered by nickname
  const { data: players } = await supabase
    .from("players")
    .select("id, nickname, avatar_url, current_elo")
    .neq("id", ctx.player.id)
    .order("nickname", { ascending: true });

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <Swords className="size-7 text-primary" />
        <div>
          <h1 className="font-mono text-3xl font-bold">Reportar partida</h1>
          <p className="text-sm text-muted-foreground">
            Tu oponente deberá aprobarla para que el Elo se actualice.
          </p>
        </div>
      </header>

      {players && players.length > 0 ? (
        <ReportForm
          roster={players as { id: string; nickname: string; avatar_url: string | null; current_elo: number }[]}
          reporter={{
            id: ctx.player.id,
            nickname: ctx.player.nickname,
            current_elo: ctx.player.current_elo,
            games_played: ctx.player.games_played,
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-medium">No hay oponentes disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Espera a que otros miembros se unan al ranking.
          </p>
        </div>
      )}
    </main>
  );
}
