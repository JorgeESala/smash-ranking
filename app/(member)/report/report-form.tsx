"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportMatch } from "@/lib/matches/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { MATCH_FORMATS, isValidScore } from "@/lib/match-format";
import { previewEloChange } from "@/lib/elo";
import { Swords, TrendingUp, TrendingDown, Crown, Skull } from "lucide-react";
import { toast } from "sonner";
import type { MatchFormat } from "@/lib/supabase/types";

type RosterEntry = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  current_elo: number;
};

type Reporter = {
  id: string;
  nickname: string;
  current_elo: number;
  games_played: number;
};

type Props = {
  roster: RosterEntry[];
  reporter: Reporter;
};

export function ReportForm({ roster, reporter }: Props) {
  const router = useRouter();
  const [opponentId, setOpponentId] = useState<string>(roster[0]?.id ?? "");
  const [format, setFormat] = useState<MatchFormat>("bo5");
  const [reporterIsWinner, setReporterIsWinner] = useState(true);
  const [winnerScore, setWinnerScore] = useState<number>(
    format === "bo5" ? 3 : format === "bo3" ? 2 : 5,
  );
  const [loserScore, setLoserScore] = useState<number>(0);
  const [pending, startTransition] = useTransition();

  const opponent = useMemo(
    () => roster.find((p) => p.id === opponentId) ?? null,
    [roster, opponentId],
  );

  const scoreValid = isValidScore(format, winnerScore, loserScore);

  const eloPreview = useMemo(() => {
    if (!opponent) return null;
    return previewEloChange(
      reporter.current_elo,
      opponent.current_elo,
      reporter.games_played,
      30, // approximate; server has exact count
      reporterIsWinner,
    );
  }, [opponent, reporter, reporterIsWinner]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!opponent) {
      toast.error("Elige un oponente");
      return;
    }
    if (!scoreValid) {
      toast.error("Puntaje inválido para ese formato");
      return;
    }
    const fd = new FormData();
    fd.set("opponentId", opponent.id);
    fd.set("format", format);
    fd.set("winnerScore", String(winnerScore));
    fd.set("loserScore", String(loserScore));
    fd.set("reporterIsWinner", String(reporterIsWinner));

    startTransition(async () => {
      const res = await reportMatch(fd);
      if (res.ok) {
        toast.success("Partida reportada. Pendiente de aprobación.");
        router.push("/inbox");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Opponent picker */}
      <section className="space-y-2">
        <Label>Oponente</Label>
        <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border bg-card p-2 sm:grid-cols-2">
          {roster.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpponentId(p.id)}
              className={
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors " +
                (p.id === opponentId
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                  : "hover:bg-muted")
              }
            >
              <PlayerAvatar src={p.avatar_url} nickname={p.nickname} size="xs" />
              <span className="flex-1 truncate font-medium">{p.nickname}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {p.current_elo}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Format */}
      <section className="space-y-2">
        <Label>Formato</Label>
        <div className="grid grid-cols-3 gap-2">
          {MATCH_FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFormat(f.value);
                setWinnerScore(f.maxWinner);
                setLoserScore(0);
              }}
              className={
                "rounded-md border p-3 text-left transition-colors " +
                (format === f.value
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border bg-card hover:border-primary/30")
              }
            >
              <div className="text-sm font-semibold">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Winner */}
      <section className="space-y-2">
        <Label>¿Quién ganó?</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setReporterIsWinner(true)}
            className={
              "flex items-center gap-2 rounded-md border p-3 text-sm transition-colors " +
              (reporterIsWinner
                ? "border-success/50 bg-success/10"
                : "border-border bg-card hover:border-success/30")
            }
          >
            <Crown className="size-4 text-success" />
            <span className="font-medium">Yo ({reporter.nickname})</span>
          </button>
          <button
            type="button"
            onClick={() => setReporterIsWinner(false)}
            disabled={!opponent}
            className={
              "flex items-center gap-2 rounded-md border p-3 text-sm transition-colors " +
              (!reporterIsWinner
                ? "border-success/50 bg-success/10"
                : "border-border bg-card hover:border-success/30")
            }
          >
            <Crown className="size-4 text-success" />
            <span className="font-medium truncate">
              {opponent?.nickname ?? "—"}
            </span>
          </button>
        </div>
      </section>

      {/* Score */}
      <section className="space-y-2">
        <Label>Puntaje</Label>
        <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">Ganador</span>
            <Input
              type="number"
              min={0}
              max={5}
              value={winnerScore}
              onChange={(e) => setWinnerScore(Number(e.target.value))}
              className="text-center font-mono text-lg"
            />
          </div>
          <span className="pt-5 font-mono text-2xl text-muted-foreground">-</span>
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">Perdedor</span>
            <Input
              type="number"
              min={0}
              max={4}
              value={loserScore}
              onChange={(e) => setLoserScore(Number(e.target.value))}
              className="text-center font-mono text-lg"
            />
          </div>
        </div>
        {!scoreValid && (
          <p className="text-xs text-destructive">
            Puntaje inválido para el formato seleccionado.
          </p>
        )}
      </section>

      {/* Elo preview */}
      {opponent && scoreValid && eloPreview && (
        <section className="rounded-md border border-border bg-card p-3">
          <div className="mb-2 text-xs text-muted-foreground">
            Vista previa de Elo (aprox.)
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{reporter.nickname}</span>
              <span className="ml-auto font-mono">
                {reporter.current_elo}
              </span>
              <span
                className={
                  "ml-1 inline-flex items-center font-mono text-xs " +
                  (eloPreview.reporterDelta >= 0
                    ? "text-success"
                    : "text-destructive")
                }
              >
                {eloPreview.reporterDelta >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {eloPreview.reporterDelta > 0
                  ? `+${eloPreview.reporterDelta}`
                  : eloPreview.reporterDelta}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{opponent.nickname}</span>
              <span className="ml-auto font-mono">
                {opponent.current_elo}
              </span>
              <span
                className={
                  "ml-1 inline-flex items-center font-mono text-xs " +
                  (eloPreview.opponentDelta >= 0
                    ? "text-success"
                    : "text-destructive")
                }
              >
                {eloPreview.opponentDelta >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {eloPreview.opponentDelta > 0
                  ? `+${eloPreview.opponentDelta}`
                  : eloPreview.opponentDelta}
              </span>
            </div>
          </div>
        </section>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || !scoreValid}>
        <Swords />
        {pending ? "Enviando…" : "Reportar partida"}
      </Button>
    </form>
  );
}
