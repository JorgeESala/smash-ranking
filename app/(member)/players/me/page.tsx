import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/require-member";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { MatchCard } from "@/components/match/match-card";
import { Trophy, Swords, TrendingUp, TrendingDown } from "lucide-react";

export const metadata = { title: "Mi perfil" };

export default async function MyProfilePage() {
  const ctx = await requireMember("/players/me");
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, status, reporter:players!reporter_id(nickname,avatar_url), opponent:players!opponent_id(nickname,avatar_url), winner:players!winner_id(nickname)",
    )
    .or(`reporter_id.eq.${ctx.player.id},opponent_id.eq.${ctx.player.id}`)
    .order("created_at", { ascending: false })
    .limit(15);

  const wr = ctx.player.games_played > 0
    ? Math.round((ctx.player.wins / ctx.player.games_played) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-start gap-5">
        <PlayerAvatar
          src={ctx.player.avatar_url}
          nickname={ctx.player.nickname}
          size="lg"
        />
        <div className="flex-1 space-y-1">
          <h1 className="font-mono text-3xl font-bold">
            {ctx.player.nickname}
          </h1>
          <p className="text-sm text-muted-foreground">{ctx.email}</p>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Elo" value={ctx.player.current_elo} highlight />
        <Stat label="Peak" value={ctx.player.peak_elo} icon={<TrendingUp className="size-3" />} />
        <Stat label="Victorias" value={ctx.player.wins} icon={<Trophy className="size-3" />} />
        <Stat label="Derrotas" value={ctx.player.losses} icon={<TrendingDown className="size-3" />} />
      </div>

      <div className="mb-2 flex items-end justify-between">
        <h2 className="font-mono text-xl font-bold">Mis partidas</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {wr}% win rate
        </span>
      </div>

      {matches && matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m as never} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Swords className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="font-medium">Sin partidas aún</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reporta tu primera partida desde el botón &ldquo;Reportar
            partida&rdquo;.
          </p>
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={
          highlight
            ? "mt-1 font-mono text-2xl font-bold text-neon-primary"
            : "mt-1 font-mono text-2xl font-bold"
        }
      >
        {value}
      </div>
    </div>
  );
}
