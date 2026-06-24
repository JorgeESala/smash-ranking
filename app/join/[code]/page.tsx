// Invite-code gate. Validates the URL code against NEXT_PUBLIC_INVITE_CODE,
// then shows the signup form: nickname + email + password + confirm.
import { redirect } from "next/navigation";
import { signUpNewMember } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, AlertCircle } from "lucide-react";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function JoinPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { error } = await searchParams;
  const expected = process.env.NEXT_PUBLIC_INVITE_CODE;

  if (!expected || code !== expected) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-destructive/40 bg-card p-8 text-center">
          <AlertCircle className="mx-auto size-8 text-destructive" />
          <h1 className="font-mono text-xl font-bold">Invitación inválida</h1>
          <p className="text-sm text-muted-foreground">
            Este enlace de invitación no es válido. Pídele uno nuevo a quien
            te invitó.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-neon-secondary">
        <div className="space-y-1 text-center">
          <Sparkles className="mx-auto size-6 text-secondary" />
          <h1 className="font-mono text-2xl font-bold text-neon-secondary">
            Únete al multiverso
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea tu cuenta. Vas a competir con tus amigos por el ranking.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {decodeError(error)}
          </div>
        )}

        <form action={signUpNewMember} className="space-y-4">
          <input type="hidden" name="code" value={code} />
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              name="nickname"
              type="text"
              required
              minLength={2}
              maxLength={24}
              autoComplete="username"
              placeholder="TuMain"
            />
            <p className="text-xs text-muted-foreground">
              2 a 24 caracteres. Visible en el ranking.
            </p>
          </div>
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
            <Label htmlFor="password">Contraseña</Label>
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
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres.
            </p>
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
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            <Sparkles />
            Crear mi cuenta
          </Button>
        </form>
      </div>
    </main>
  );
}

function decodeError(code: string): string {
  const map: Record<string, string> = {
    invalid_input: "Datos inválidos. Revisa los campos.",
    nickname_taken: "Ese nickname ya está en uso. Elige otro.",
    password_mismatch: "Las contraseñas no coinciden.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    create_failed: "No se pudo crear la cuenta. Intenta de nuevo.",
  };
  return map[code] ?? code;
}
