"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/require-member";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateNickname(formData: FormData): Promise<ActionResult> {
  const ctx = await requireMember();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (nickname.length < 2 || nickname.length > 24) {
    return { ok: false, error: "Nickname inválido (2 a 24 caracteres)" };
  }
  if (nickname === ctx.player.nickname) {
    return { ok: false, error: "Es el mismo nickname" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .update({ nickname })
    .eq("id", ctx.player.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ese nickname ya está en uso" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/players/me");
  revalidatePath(`/players/${encodeURIComponent(ctx.player.nickname)}`);
  revalidatePath(`/players/${encodeURIComponent(nickname)}`);
  revalidatePath("/leaderboard");
  return { ok: true };
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const ctx = await requireMember();
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { ok: false, error: "Archivo inválido" };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Máximo 2 MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Debe ser una imagen" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${ctx.userId}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error: dbErr } = await supabase
    .from("players")
    .update({ avatar_url: pub.publicUrl })
    .eq("id", ctx.player.id);
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidatePath("/players/me");
  return { ok: true };
}
