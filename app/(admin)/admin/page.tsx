import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { endSeason, startNewSeason } from "./actions";
import { Shield, Calendar, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  // Throws on non-admin — middleware already gates the route, but be safe.
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, starts_at, ends_at, is_active, is_demo")
    .order("starts_at", { ascending: false });

  const { data: counts } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <Shield className="size-7 text-secondary" />
        <h1 className="font-mono text-3xl font-bold">Admin</h1>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Jugadores" value={counts?.length ?? 0} icon={<Users />} />
        <KPI label="Temporadas" value={seasons?.length ?? 0} icon={<Calendar />} />
      </section>

      <section className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <Trophy className="size-4" />
          Temporadas
        </h2>

        {seasons && seasons.length > 0 ? (
          <ul className="divide-y divide-border">
            {seasons.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {s.name}
                    {s.is_active && (
                      <span className="rounded border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[0.65rem] uppercase text-success">
                        Activa
                      </span>
                    )}
                    {s.is_demo && (
                      <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] uppercase text-muted-foreground">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {new Date(s.starts_at).toLocaleDateString("es")} →{" "}
                    {s.ends_at
                      ? new Date(s.ends_at).toLocaleDateString("es")
                      : "presente"}
                  </p>
                </div>
                {s.is_active && <EndSeasonButton seasonId={s.id} />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin temporadas.</p>
        )}
      </section>

      <section className="rounded-xl border border-secondary/30 bg-card p-6 shadow-neon-secondary">
        <h2 className="mb-4 font-bold">Iniciar nueva temporada</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Termina la temporada activa (si hay) y resetea todos los Elo a 1200.
        </p>
        <form action={startNewSeason} className="flex gap-2">
          <Input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            placeholder="Nombre de la temporada"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Iniciar
          </Button>
        </form>
      </section>
    </main>
  );
}

function KPI({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-bold">{value}</div>
    </div>
  );
}

function EndSeasonButton({ seasonId }: { seasonId: string }) {
  return (
    <form action={endSeason}>
      <input type="hidden" name="seasonId" value={seasonId} />
      <Button type="submit" variant="destructive" size="sm">
        Terminar
      </Button>
    </form>
  );
}
