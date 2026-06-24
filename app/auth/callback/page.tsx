// Auth callback handler. Two flows land here:
//   1. Password recovery: Supabase reset-password email link
//      /auth/callback?code=xxx&type=recovery  →  /reset-password
//   2. (Reserved for future flows that need code exchange, e.g. OAuth)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ code?: string; type?: string; next?: string }>;
};

export default async function AuthCallbackPage({ searchParams }: Props) {
  const { code, type, next } = await searchParams;
  if (!code) redirect("/login?error=missing_code");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // Password recovery flow → user is now in a recovery session; bounce to
  // the password-reset form. They must use the session to call updateUser.
  if (type === "recovery") {
    redirect("/reset-password");
  }

  // After any other code exchange, ensure the user has a player row.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=no_user");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!player) redirect("/onboarding");
  redirect(next && next !== "/" ? next : "/");
}
