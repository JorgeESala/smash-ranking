// Server-side guard: throws/redirects if the request is not authenticated.
// Returns the authenticated player row when called from a server component
// or server action.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/lib/supabase/types";

export type AuthContext = {
  userId: string;
  email: string;
  player: Player;
};

export async function requireMember(nextPath?: string): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const qs = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${qs}`);
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!player) {
    // Authenticated but no player row — they need to finish onboarding.
    redirect("/onboarding");
  }

  return { userId: user.id, email: user.email!, player };
}

export async function getOptionalMember(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!player) return null;
  return { userId: user.id, email: user.email!, player };
}
