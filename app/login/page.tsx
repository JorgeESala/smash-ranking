import Link from "next/link";
import { signIn } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  searchParams: Promise<{ sent?: string; error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const passwordUpdated = false; // we can't read searchParams here easily; use search param below
  const error = params.error;
  const next = params.next ?? "/";

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-neon-primary">
        <div className="space-y-1 text-center">
          <h1 className="font-mono text-2xl font-bold text-neon-primary">
            Iniciar sesión
          </h1>
          <p className="text-sm text-muted-foreground">
            Entra con tu correo y contraseña.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{decodeError(error)}</span>
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                ¿La olvidaste?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full">
            <LogIn />
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          ¿No tienes cuenta? Pide un enlace de invitación a quien administra
          el ranking.
        </p>
      </div>
    </main>
  );
}

function decodeError(code: string): string {
  const map: Record<string, string> = {
    invalid_input: "Revisa el correo y la contraseña.",
    invalid_credentials: "Correo o contraseña incorrectos.",
    invalid_invite: "Código de invitación inválido.",
    invalid_email: "Correo inválido.",
    no_user: "Sesión inválida. Intenta de nuevo.",
  };
  return map[code] ?? code;
}
