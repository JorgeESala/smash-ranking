import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="text-center">
        <p className="font-mono text-6xl font-bold text-neon-primary">404</p>
        <h1 className="mt-2 font-mono text-xl">No encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta página no existe en el multiverso.
        </p>
        <Button render={<Link href="/" />} className="mt-6">
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}
