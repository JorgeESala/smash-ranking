// Onboarding action: creates the player row for the current auth user
// using the pending_nickname from user_metadata, or a fresh nickname.
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let nickname = String(formData.get("nickname") ?? "").trim();
  const fromMeta = (user.user_metadata?.pending_nickname as string | undefined) ?? "";
  if (!nickname) nickname = fromMeta;

  if (nickname.length < 2 || nickname.length > 24) {
    redirect("/onboarding?error=invalid_nickname");
  }

  // Insert player; if nickname taken, fall through to the error
  const { error } = await supabase
    .from("players")
    .insert({ auth_user_id: user.id, nickname });

  if (error) {
    if (error.code === "23505") {
      redirect("/onboarding?error=nickname_taken");
    }
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
