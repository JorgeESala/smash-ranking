// Onboarding: pick a nickname, create the player row.
import { completeOnboarding } from "@/lib/auth/onboarding";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, AlertCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already onboarded?
  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/");

  const presetNickname = (user.user_metadata?.pending_nickname as string) ?? "";

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-neon-accent">
        <div className="space-y-1 text-center">
          <UserPlus className="mx-auto size-6 text-accent" />
          <h1 className="font-mono text-2xl font-bold text-neon-accent">
            Elige tu nickname
          </h1>
          <p className="text-sm text-muted-foreground">
            Será tu nombre en el ranking.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{decodeError(error)}</span>
          </div>
        )}

        <form action={completeOnboarding} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              name="nickname"
              type="text"
              required
              minLength={2}
              maxLength={24}
              defaultValue={presetNickname}
              autoComplete="username"
            />
          </div>
          <Button type="submit" variant="accent" className="w-full">
            <UserPlus />
            Entrar al multiverso
          </Button>
        </form>
      </div>
    </main>
  );
}

function decodeError(code: string): string {
  const map: Record<string, string> = {
    invalid_nickname: "Nickname inválido (2 a 24 caracteres).",
    nickname_taken: "Ese nickname ya está en uso. Elige otro.",
  };
  return map[code] ?? code;
}
