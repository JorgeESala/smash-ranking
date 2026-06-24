import { PlayerAvatar } from "@/components/player/player-avatar";
import { formatDistanceToNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getFormat } from "@/lib/match-format";
import type { MatchFormat } from "@/lib/supabase/types";

type MatchWithPlayers = {
  id: string;
  winner_score: number;
  loser_score: number;
  format: MatchFormat;
  created_at: string;
  reporter?: { nickname: string; avatar_url: string | null } | null;
  opponent?: { nickname: string; avatar_url: string | null } | null;
  winner?: { nickname: string } | null;
};

type Props = {
  match: MatchWithPlayers;
  href?: string;
};

export function MatchCard({ match, href }: Props) {
  const reporterWon = match.winner?.nickname === match.reporter?.nickname;
  const fmt = getFormat(match.format);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
      <Player
        nickname={match.reporter?.nickname ?? "?"}
        avatar={match.reporter?.avatar_url ?? null}
        winner={reporterWon}
      />
      <Score winner={match.winner_score} loser={match.loser_score} />
      <Player
        nickname={match.opponent?.nickname ?? "?"}
        avatar={match.opponent?.avatar_url ?? null}
        winner={!reporterWon}
      />
      <span className="ml-auto hidden font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground sm:inline">
        {fmt.label}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {formatDistanceToNow(match.created_at)}
      </span>
      {href && (
        <a
          href={href}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          →
        </a>
      )}
    </div>
  );
}

function Player({
  nickname,
  avatar,
  winner,
}: {
  nickname: string;
  avatar: string | null;
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2 truncate",
        winner ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <PlayerAvatar src={avatar} nickname={nickname} size="xs" />
      <span className={cn("truncate", winner && "font-semibold")}>
        {nickname}
      </span>
    </div>
  );
}

function Score({ winner, loser }: { winner: number; loser: number }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md bg-background px-2 py-1 font-mono text-sm font-bold">
      <span className="text-primary">{winner}</span>
      <span className="text-muted-foreground">-</span>
      <span className="text-muted-foreground">{loser}</span>
    </div>
  );
}
