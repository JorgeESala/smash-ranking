"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="text-center">
        <p className="font-mono text-3xl font-bold text-destructive">
          Algo salió mal
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Error inesperado"}
        </p>
        <Button onClick={reset} className="mt-6">
          Reintentar
        </Button>
      </div>
    </main>
  );
}
