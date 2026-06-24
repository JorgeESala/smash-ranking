// Reset password — requires an active session (set by the recovery email
// flow). If the user lands here without a session (e.g. typed the URL
// directly), bounce them to /forgot-password.
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-neon-primary">
        <div className="space-y-1 text-center">
          <h1 className="font-mono text-2xl font-bold text-neon-primary">
            Nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Elige una contraseña nueva para tu cuenta.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{decodeError(error)}</span>
          </div>
        )}

        <form action={updatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Repite la contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres.
            </p>
          </div>
          <Button type="submit" className="w-full">
            <Lock />
            Cambiar contraseña
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="hover:text-primary">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

function decodeError(code: string): string {
  const map: Record<string, string> = {
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    password_mismatch: "Las contraseñas no coinciden.",
  };
  return map[code] ?? code;
}
