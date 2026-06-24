import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/require-member";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { MatchActions } from "./match-actions";
import { getFormat } from "@/lib/match-format";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = { title: "Detalle de partida" };

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requireMember(`/matches/${id}`);
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, season_id, winner_score, loser_score, format, status, created_at, resolved_at, reporter:players!reporter_id(id, nickname, avatar_url), opponent:players!opponent_id(id, nickname, avatar_url), winner:players!winner_id(id, nickname), season:seasons!season_id(name, is_demo)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!match) notFound();

  const reporterWon = match.winner?.id === match.reporter?.id;
  const fmt = getFormat(match.format);

  const isParticipant =
    match.reporter?.id === ctx.player.id || match.opponent?.id === ctx.player.id;
  const isPending = match.status === "pending";
  const isOpponentTurn =
    isPending && match.opponent?.id === ctx.player.id;
  const isReporter =
    isPending && match.reporter?.id === ctx.player.id;

  // Get actions history
  const { data: actions } = await supabase
    .from("match_actions")
    .select("id, action, reason, created_at, actor:players!actor_id(nickname)")
    .eq("match_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Button render={<Link href="/inbox" />} variant="ghost" size="sm" className="mb-4">
        <ArrowLeft />
        Inbox
      </Button>

      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold">Detalle de partida</h1>
        <MatchStatusBadge status={match.status} />
      </header>

      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-border bg-card p-6">
        <PlayerSide player={match.reporter} winner={reporterWon} side="left" />
        <Score winner={match.winner_score} loser={match.loser_score} />
        <PlayerSide player={match.opponent} winner={!reporterWon} side="right" />
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Meta label="Formato">{fmt.label}</Meta>
        <Meta label="Reportado">{formatDate(match.created_at)}</Meta>
        <Meta label="Temporada">{match.season?.name ?? "—"}</Meta>
        {match.resolved_at && (
          <Meta label="Resuelto">{formatDate(match.resolved_at)}</Meta>
        )}
      </dl>

      {/* Action panel */}
      {isOpponentTurn && <MatchActions mode="approve-dispute" matchId={id} />}
      {isReporter && <MatchActions mode="cancel" matchId={id} />}
      {!isParticipant && match.status === "pending" && (
        <p className="rounded-md border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
          Esta partida está pendiente de aprobación por {match.opponent?.nickname}.
        </p>
      )}
      {match.status !== "pending" && (
        <p className="rounded-md border border-border bg-card p-4 text-sm">
          Partida {match.status === "approved" ? "aprobada" : match.status === "disputed" ? "disputada" : "cancelada"}.
        </p>
      )}

      {/* Action history */}
      {actions && actions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Historial
          </h2>
          <ul className="space-y-2 text-sm">
            {actions.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-border bg-card/50 p-3"
              >
                <span className="font-medium">
                  {a.actor && "nickname" in a.actor
                    ? (a.actor as { nickname: string }).nickname
                    : "—"}
                </span>
                {" "}
                <span className="text-muted-foreground">
                  {a.action === "approve"
                    ? "aprobó la partida"
                    : a.action === "dispute"
                      ? "disputó la partida"
                      : "canceló la partida"}
                </span>
                {a.reason && (
                  <p className="mt-1 text-muted-foreground">
                    &ldquo;{a.reason}&rdquo;
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {formatDate(a.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function PlayerSide({
  player,
  winner,
  side,
}: {
  player: { id: string; nickname: string; avatar_url: string | null } | null;
  winner: boolean;
  side: "left" | "right";
}) {
  if (!player) {
    return <div />;
  }
  return (
    <div
      className={
        "flex flex-col items-center gap-2 " + (side === "right" ? "text-right" : "")
      }
    >
      <PlayerAvatar src={player.avatar_url} nickname={player.nickname} size="lg" />
      <div>
        <Link
          href={`/players/${encodeURIComponent(player.nickname)}`}
          className="font-semibold hover:text-primary"
        >
          {player.nickname}
        </Link>
        {winner && (
          <div className="font-mono text-xs uppercase tracking-wider text-success">
            Ganador
          </div>
        )}
      </div>
    </div>
  );
}

function Score({ winner, loser }: { winner: number; loser: number }) {
  return (
    <div className="flex flex-col items-center font-mono">
      <div className="text-5xl font-bold">
        <span className="text-primary">{winner}</span>
        <span className="mx-1 text-2xl text-muted-foreground">-</span>
        <span className="text-muted-foreground">{loser}</span>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
