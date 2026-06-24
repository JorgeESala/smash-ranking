import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOptionalMember } from "@/lib/auth/require-member";
import { Button } from "@/components/ui/button";
import { Swords, Trophy, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { MatchCard } from "@/components/match/match-card";

export default async function HomePage() {
  const supabase = await createClient();
  const ctx = await getOptionalMember();

  // Top 5 of the current (real) season
  const { data: topPlayers } = await supabase
    .from("players")
    .select("id, nickname, avatar_url, current_elo, games_played, wins, losses")
    .order("current_elo", { ascending: false })
    .limit(5);

  // Recent approved matches
  const { data: recentMatches } = await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, reporter:players!reporter_id(nickname,avatar_url), opponent:players!opponent_id(nickname,avatar_url), winner:players!winner_id(nickname)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <>
      {/* HERO */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center sm:py-24">
          <div className="relative h-28 w-28 sm:h-36 sm:w-36">
            <Image
              src="/funiverse-logo.jpg"
              alt="Funiverse — El Multiversó de la Diversión"
              fill
              priority
              sizes="(max-width: 640px) 7rem, 9rem"
              className="rounded-2xl object-cover shadow-neon-primary"
            />
          </div>

          <div className="space-y-3">
            <h1 className="font-mono text-4xl font-bold tracking-tight text-neon-primary sm:text-5xl">
              YOSHOS RANKING
            </h1>
            <p className="mx-auto max-w-md text-balance text-sm text-muted-foreground sm:text-base">
              Ranking comunitario de Super Smash Bros. con flujo de aprobación
              mutua. Reporta una partida, tu oponente la aprueba, y el Elo se
              actualiza en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {ctx ? (
              <Button render={<Link href="/report" />} size="lg">
                <Swords />
                Reportar partida
              </Button>
            ) : (
              <Button render={<Link href="/join/yoshos" />} size="lg">
                <Sparkles />
                Únete al multiverso
              </Button>
            )}
            <Button render={<Link href="/leaderboard" />} variant="outline" size="lg">
              <Trophy />
              Ver ranking
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center font-mono text-2xl font-bold text-neon-secondary sm:text-3xl">
            Cómo funciona
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Step
              n={1}
              icon={<Swords className="size-5" />}
              title="Reporta"
              desc="Elige a tu oponente, formato (mejor de 5, 3 o primero en 5) y los puntajes."
              color="primary"
            />
            <Step
              n={2}
              icon={<ShieldCheck className="size-5" />}
              title="Aprueba"
              desc="Tu oponente recibe la notificación y la aprueba o la disputa en un toque."
              color="secondary"
            />
            <Step
              n={3}
              icon={<Trophy className="size-5" />}
              title="Sube"
              desc="El Elo se recalcula al aprobarse. La tabla se actualiza al instante para todos."
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* TOP 5 PREVIEW */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-mono text-2xl font-bold sm:text-3xl">
              Top del ranking
            </h2>
            <Button render={<Link href="/leaderboard" />} variant="ghost" size="sm">
              Ver completo
              <ArrowRight />
            </Button>
          </div>
          {topPlayers && topPlayers.length > 0 ? (
            <LeaderboardTable players={topPlayers} compact />
          ) : (
            <EmptyState
              title="Aún no hay jugadores en el ranking"
              description="Sé el primero en unirte al multiverso."
            />
          )}
        </div>
      </section>

      {/* RECENT MATCHES */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-mono text-2xl font-bold sm:text-3xl">
              Partidas recientes
            </h2>
            <Button render={<Link href="/matches" />} variant="ghost" size="sm">
              Ver todas
              <ArrowRight />
            </Button>
          </div>
          {recentMatches && recentMatches.length > 0 ? (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <MatchCard key={m.id} match={m as never} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin partidas aprobadas aún"
              description="Las partidas aparecerán aquí cuando sean aprobadas."
            />
          )}
        </div>
      </section>

      {/* JOIN CTA */}
      {!ctx && (
        <section>
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <div className="rounded-2xl border border-secondary/30 bg-card p-8 shadow-neon-secondary sm:p-12">
              <Sparkles className="mx-auto mb-4 size-8 text-secondary" />
              <h3 className="mb-2 font-mono text-2xl font-bold text-neon-secondary">
                ¿Listo para unirte?
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Necesitas un enlace de invitación. Pídele uno al admin del
                ranking.
              </p>
              <Button render={<Link href="/login" />} size="lg" variant="secondary">
                Ya tengo cuenta
                <ArrowRight />
              </Button>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-auto border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          Yoshos Ranking · El multiversó de la diversión
        </p>
      </footer>
    </>
  );
}

function Step({
  n,
  icon,
  title,
  desc,
  color,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "primary" | "secondary" | "accent";
}) {
  const ring = {
    primary: "shadow-neon-primary text-neon-primary",
    secondary: "shadow-neon-secondary text-neon-secondary",
    accent: "shadow-neon-accent text-neon-accent",
  }[color];
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div
        className={`mb-4 inline-flex size-10 items-center justify-center rounded-full border border-current bg-background ${ring}`}
      >
        {icon}
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">0{n}</span>
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
