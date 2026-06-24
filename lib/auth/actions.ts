"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  signInSchema,
  signUpSchema,
  resetRequestSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";

// ============================================================================
// Sign in (password)
// ============================================================================
export async function signIn(formData: FormData) {
  const next = String(formData.get("next") ?? "/");
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    redirect(`/login?error=invalid_input&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const code =
      error.message.toLowerCase().includes("credentials")
        ? "invalid_credentials"
        : encodeURIComponent(error.message);
    redirect(`/login?error=${code}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

// ============================================================================
// Sign up (invite-code gated, password-based)
// ============================================================================
export async function signUpNewMember(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    nickname: String(formData.get("nickname") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    redirect(
      `/join/${encodeURIComponent(String(formData.get("code") ?? ""))}?error=${
        field === "confirmPassword" ? "password_mismatch" : "invalid_input"
      }`,
    );
  }
  const d = parsed.data;

  if (d.code !== process.env.NEXT_PUBLIC_INVITE_CODE) {
    redirect(`/login?error=invalid_invite`);
  }

  const admin = createServiceClient();

  // 1) Create auth user with password (skip email confirmation: this is an
  //    invite-only app, the email is verified by us, not by Supabase).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
    user_metadata: { nickname: d.nickname },
  });
  if (createErr || !created.user) {
    redirect(
      `/join/${encodeURIComponent(d.code)}?error=${encodeURIComponent(
        createErr?.message ?? "create_failed",
      )}`,
    );
  }

  // 2) Create the player row. If the nickname is taken, undo the auth user.
  const { error: playerErr } = await admin
    .from("players")
    .insert({ auth_user_id: created.user.id, nickname: d.nickname });
  if (playerErr) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    if (playerErr.code === "23505") {
      redirect(`/join/${encodeURIComponent(d.code)}?error=nickname_taken`);
    }
    redirect(
      `/join/${encodeURIComponent(d.code)}?error=${encodeURIComponent(playerErr.message)}`,
    );
  }

  // 3) Sign the new user in. This sets cookies via @supabase/ssr.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: d.email,
    password: d.password,
  });
  if (signInErr) {
    redirect(`/login?error=${encodeURIComponent(signInErr.message)}`);
  }

  revalidatePath("/leaderboard");
  redirect("/");
}

// ============================================================================
// Forgot password — sends a recovery email
// ============================================================================
export async function requestPasswordReset(formData: FormData) {
  const parsed = resetRequestSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) {
    redirect("/forgot-password?error=invalid_email");
  }

  const supabase = await createClient();
  // Always succeed silently to prevent email enumeration attacks.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery&next=/reset-password`,
  });
  redirect("/forgot-password?sent=1");
}

// ============================================================================
// Reset password — requires an active recovery session
// ============================================================================
export async function updatePassword(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const code = issue?.path[0] === "confirmPassword" ? "password_mismatch" : "weak_password";
    redirect(`/reset-password?error=${code}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/?password_updated=1");
}

// ============================================================================
// Sign out
// ============================================================================
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
