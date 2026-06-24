import Link from "next/link";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { cn } from "@/lib/utils";

type PlayerRow = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  current_elo: number;
  games_played?: number;
  wins?: number;
  losses?: number;
};

type Props = {
  players: PlayerRow[];
  compact?: boolean;
};

export function LeaderboardTable({ players, compact = false }: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        compact ? "" : "",
      )}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Jugador</th>
            <th className="px-4 py-2.5 text-right font-medium">Elo</th>
            {!compact && (
              <>
                <th className="px-4 py-2.5 text-right font-medium">G-P</th>
                <th className="px-4 py-2.5 text-right font-medium">Win %</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const games = p.wins !== undefined && p.losses !== undefined
              ? p.wins + p.losses
              : (p.games_played ?? 0);
            const wr = games > 0 && p.wins !== undefined
              ? Math.round((p.wins / games) * 100)
              : null;
            return (
              <tr
                key={p.id}
                className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/players/${encodeURIComponent(p.nickname)}`}
                    className="flex items-center gap-3"
                  >
                    <PlayerAvatar
                      src={p.avatar_url}
                      nickname={p.nickname}
                      size="sm"
                    />
                    <span className="font-medium hover:text-primary">
                      {p.nickname}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  {p.current_elo}
                </td>
                {!compact && (
                  <>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                      {p.wins ?? 0}-{p.losses ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                      {wr !== null ? `${wr}%` : "—"}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
