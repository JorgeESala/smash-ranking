import { Swords, ShieldCheck, Trophy, Bell } from "lucide-react";

export const metadata = { title: "Cómo funciona" };

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="font-mono text-3xl font-bold text-neon-primary sm:text-4xl">
          Cómo funciona
        </h1>
        <p className="mt-2 text-muted-foreground">
          El flujo de aprobación mutua en 4 pasos
        </p>
      </header>

      <div className="space-y-4">
        <Step
          n={1}
          icon={<Swords className="size-5" />}
          color="primary"
          title="Reporta la partida"
          body="Cuando termines de jugar, abre la app y reporta el resultado. Elige a tu oponente de la lista de jugadores, el formato (mejor de 5, mejor de 3, o primero en 5) y los puntajes finales."
        />
        <Step
          n={2}
          icon={<Bell className="size-5" />}
          color="secondary"
          title="Tu oponente recibe una notificación"
          body="En cuanto reportas, le llega una push a tu oponente. También aparece en su inbox dentro de la app. La partida queda en estado pendiente."
        />
        <Step
          n={3}
          icon={<ShieldCheck className="size-5" />}
          color="accent"
          title="Aprueba o disputa"
          body="Tu oponente revisa los datos. Si todo está bien, aprueba en un toque. Si los puntajes no coinciden, puede disputar con un comentario — en ese caso no se modifica el Elo de nadie."
        />
        <Step
          n={4}
          icon={<Trophy className="size-5" />}
          color="primary"
          title="El ranking se actualiza"
          body="Al aprobarse, el Elo de ambos se recalcula con la fórmula clásica. Todos los que tengan la app abierta verán el cambio en el leaderboard en tiempo real."
        />
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 font-mono text-lg font-bold">Sobre el Elo</h2>
        <p className="text-sm text-muted-foreground">
          Usamos la fórmula clásica con un K-factor de <span className="font-mono text-foreground">40</span> para los primeros
          30 juegos de un jugador y <span className="font-mono text-foreground">32</span> después. Cada temporada arranca
          en <span className="font-mono text-foreground">1200</span> para todos. El Elo máximo histórico queda
          registrado en tu perfil.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 font-mono text-lg font-bold">Privacidad</h2>
        <p className="text-sm text-muted-foreground">
          El acceso es por invitación. No hay registro público, no hay bots, no
          hay spam. Tu nickname es lo único visible — no pedimos tu nombre real.
        </p>
      </section>
    </main>
  );
}

function Step({
  n,
  icon,
  color,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent";
  title: string;
  body: string;
}) {
  const ring = {
    primary: "shadow-neon-primary text-neon-primary",
    secondary: "shadow-neon-secondary text-neon-secondary",
    accent: "shadow-neon-accent text-neon-accent",
  }[color];
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`inline-flex size-10 items-center justify-center rounded-full border border-current bg-background ${ring}`}
        >
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">0{n}</span>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
