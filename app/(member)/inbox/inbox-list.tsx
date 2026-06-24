"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { approveMatch, disputeMatch, cancelMatch } from "@/lib/matches/actions";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { getFormat } from "@/lib/match-format";
import { formatDistanceToNow } from "@/lib/format";
import { Check, X, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import type { MatchFormat } from "@/lib/supabase/types";

type Player = { id: string; nickname: string; avatar_url: string | null };
type InboxMatch = {
  id: string;
  winner_score: number;
  loser_score: number;
  format: MatchFormat;
  created_at: string;
  reporter: Player | null;
  opponent: Player | null;
  winner: { nickname: string } | null;
};

type Props = {
  initialMatches: InboxMatch[];
  currentPlayerId: string;
};

export function InboxList({ initialMatches, currentPlayerId }: Props) {
  const [matches, setMatches] = useState(initialMatches);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("inbox-matches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        async () => {
          // Refetch on any change
          const { data } = await supabase
            .from("matches")
            .select(
              "id, winner_score, loser_score, format, created_at, reporter:players!reporter_id(id, nickname, avatar_url), opponent:players!opponent_id(id, nickname, avatar_url), winner:players!winner_id(nickname)",
            )
            .eq("opponent_id", currentPlayerId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });
          if (data) setMatches(data as never);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPlayerId]);

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="font-medium">Inbox vacío</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No tienes partidas pendientes de aprobación.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {matches.map((m) => {
        const reporterWon = m.winner?.nickname === m.reporter?.nickname;
        const fmt = getFormat(m.format);
        return (
          <li
            key={m.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <PlayerAvatar
                src={m.reporter?.avatar_url ?? null}
                nickname={m.reporter?.nickname ?? "?"}
                size="sm"
              />
              <div className="flex-1 truncate">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      reporterWon
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {m.reporter?.nickname}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    reportó
                  </span>
                  <span
                    className={
                      !reporterWon
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    vs {m.opponent?.nickname}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {fmt.label} · {formatDistanceToNow(m.created_at)}
                </p>
              </div>
              <Link
                href={`/matches/${m.id}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Detalle →
              </Link>
            </div>

            <div className="mb-3 flex items-center justify-center gap-3 rounded-lg bg-background p-3 font-mono text-2xl font-bold">
              <span className={reporterWon ? "text-primary" : "text-muted-foreground"}>
                {m.winner_score}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={!reporterWon ? "text-primary" : "text-muted-foreground"}>
                {m.loser_score}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  startTransition(async () => {
                    const res = await approveMatch(m.id);
                    if (res.ok) toast.success("Partida aprobada");
                    else toast.error(res.error);
                  })
                }
                disabled={pending}
                size="sm"
                className="flex-1"
              >
                <Check />
                Aprobar
              </Button>
              <DisputeButton matchId={m.id} disabled={pending} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DisputeButton({
  matchId,
  disabled,
}: {
  matchId: string;
  disabled: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <form
        action={disputeMatch}
        className="flex w-full flex-col gap-2"
      >
        <input type="hidden" name="matchId" value={matchId} />
        <textarea
          name="reason"
          required
          minLength={3}
          maxLength={500}
          placeholder="¿Qué no coincide? (visible para ambos)"
          className="min-h-12 w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={disabled}
          >
            <ShieldOff />
            Confirmar disputa
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(false)}
            disabled={disabled}
          >
            <X />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Button
      onClick={() => setShowForm(true)}
      variant="destructive"
      size="sm"
      className="flex-1"
      disabled={disabled}
    >
      <ShieldOff />
      Disputar
    </Button>
  );
}
