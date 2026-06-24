import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="text-center">
        <WifiOff className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 font-mono text-2xl font-bold">Sin conexión</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vuelve a conectarte para reportar o aprobar partidas.
        </p>
        <Link
          href="/leaderboard"
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          Ver el ranking (offline) →
        </Link>
      </div>
    </main>
  );
}
