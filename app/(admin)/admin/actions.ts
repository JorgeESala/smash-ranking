"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function endSeason(formData: FormData) {
  await requireAdmin();
  const admin = createServiceClient();
  const { error } = await admin.rpc("end_current_season");
  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  redirect("/admin");
}

export async function startNewSeason(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    redirect("/admin?error=invalid_name");
  }
  const admin = createServiceClient();
  const { error } = await admin.rpc("start_new_season", { p_name: name });
  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  redirect("/admin");
}
