import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { MatchCard } from "@/components/match/match-card";
import { getOptionalMember } from "@/lib/auth/require-member";
import { Trophy, Swords, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  params: Promise<{ nickname: string }>;
};

export default async function PlayerPage({ params }: Props) {
  const { nickname } = await params;
  const supabase = await createClient();
  const ctx = await getOptionalMember();

  const { data: player } = await supabase
    .from("players")
    .select("id, nickname, avatar_url, current_elo, peak_elo, games_played, wins, losses, created_at")
    .eq("nickname", decodeURIComponent(nickname))
    .maybeSingle();

  if (!player) notFound();

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, status, reporter:players!reporter_id(nickname,avatar_url), opponent:players!opponent_id(nickname,avatar_url), winner:players!winner_id(nickname)",
    )
    .or(`reporter_id.eq.${player.id},opponent_id.eq.${player.id}`)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  const wr = player.games_played > 0
    ? Math.round((player.wins / player.games_played) * 100)
    : 0;

  const isMe = ctx?.player.id === player.id;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-start gap-5">
        <PlayerAvatar
          src={player.avatar_url}
          nickname={player.nickname}
          size="lg"
        />
        <div className="flex-1 space-y-1">
          <h1 className="flex items-center gap-2 font-mono text-3xl font-bold">
            {player.nickname}
            {isMe && (
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[0.65rem] uppercase text-primary">
                Tú
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">@{player.nickname}</p>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Elo" value={player.current_elo} highlight />
        <Stat label="Peak" value={player.peak_elo} icon={<TrendingUp className="size-3" />} />
        <Stat label="Victorias" value={player.wins} icon={<Trophy className="size-3" />} />
        <Stat label="Derrotas" value={player.losses} icon={<TrendingDown className="size-3" />} />
      </div>

      <div className="mb-2 flex items-end justify-between">
        <h2 className="font-mono text-xl font-bold">Últimas partidas</h2>
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
          <p className="font-medium">Sin partidas aprobadas aún</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las partidas aparecerán aquí cuando sean aprobadas.
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
