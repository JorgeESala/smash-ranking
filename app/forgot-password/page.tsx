import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

type Props = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = params.error;

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-neon-accent">
        <div className="space-y-1 text-center">
          <h1 className="font-mono text-2xl font-bold text-neon-accent">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Te enviamos un enlace para crear una contraseña nueva.
          </p>
        </div>

        {sent ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                Si el correo existe en nuestro sistema, te enviamos un enlace
                de recuperación. Revisa tu bandeja de entrada.
              </span>
            </div>
            <Button render={<Link href="/login" />} variant="ghost" className="w-full">
              <ArrowLeft />
              Volver al inicio de sesión
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>Correo inválido.</span>
              </div>
            )}
            <form action={requestPasswordReset} className="space-y-4">
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
              <Button type="submit" variant="accent" className="w-full">
                <Mail />
                Enviar enlace de recuperación
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-primary">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
