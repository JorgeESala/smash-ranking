"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/require-member";
import { isValidScore } from "@/lib/match-format";
import { sendMatchReportedPush, sendMatchResolvedPush } from "@/lib/push/send";
import type { MatchFormat } from "@/lib/supabase/types";

const ReportSchema = z
  .object({
    opponentId: z.string().uuid("Oponente inválido"),
    format: z.enum(["bo3", "bo5", "first_to_5"]),
    winnerScore: z.coerce.number().int().min(0).max(5),
    loserScore: z.coerce.number().int().min(0).max(5),
    reporterIsWinner: z.coerce.boolean(),
  })
  .refine((d) => d.winnerScore > d.loserScore, {
    message: "El puntaje del ganador debe ser mayor",
    path: ["winnerScore"],
  })
  .refine((d) => isValidScore(d.format, d.winnerScore, d.loserScore), {
    message: "Puntaje inválido para ese formato",
    path: ["winnerScore"],
  });

export type ActionResult = { ok: true } | { ok: false; error: string };
export async function reportMatch(formData: FormData): Promise<ActionResult> {
  const ctx = await requireMember();
  const parsed = ReportSchema.safeParse({
    opponentId: formData.get("opponentId"),
    format: formData.get("format"),
    winnerScore: formData.get("winnerScore"),
    loserScore: formData.get("loserScore"),
    reporterIsWinner: formData.get("reporterIsWinner") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  if (d.opponentId === ctx.player.id) {
    return { ok: false, error: "No puedes reportar contra ti mismo" };
  }

  const supabase = await createClient();

  // Defense in depth: even if the dropdown was bypassed, reject matches
  // against demo players. Demo players can't log in to approve a match,
  // so allowing this would create permanently-pending rows.
  const { data: opponentRow } = await supabase
    .from("players")
    .select("is_demo")
    .eq("id", d.opponentId)
    .maybeSingle();
  if (opponentRow?.is_demo) {
    return { ok: false, error: "Solo puedes reportar partidas contra jugadores reales." };
  }

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  if (!season) {
    return { ok: false, error: "No hay temporada activa" };
  }

  // reporter_id is ALWAYS the authenticated user. opponent_id is ALWAYS
  // the other player. winner_id is one of the two.
  const winnerId = d.reporterIsWinner ? ctx.player.id : d.opponentId;

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      season_id: season.id,
      reporter_id: ctx.player.id,
      opponent_id: d.opponentId,
      winner_id: winnerId,
      format: d.format as MatchFormat,
      winner_score: d.winnerScore,
      loser_score: d.loserScore,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !match) {
    return { ok: false, error: error?.message ?? "No se pudo crear la partida" };
  }

  // Push always goes to the other player (d.opponentId), not the variable
  void sendMatchReportedPush({
    matchId: match.id,
    opponentId: d.opponentId,
    reporterNickname: ctx.player.nickname,
    score: `${d.winnerScore}-${d.loserScore}`,
  }).catch(() => {});

  revalidatePath("/inbox");
  revalidatePath("/leaderboard");
  return { ok: true };
}

export async function approveMatch(matchId: string): Promise<ActionResult> {
  const ctx = await requireMember();
  const supabase = await createClient();

  const {  error } = await supabase.rpc("approve_match", {
    p_match_id: matchId,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  // Notify the other player
  const { data: match } = await supabase
    .from("matches")
    .select("reporter_id, opponent_id")
    .eq("id", matchId)
    .single();
  if (match) {
    const otherId =
      match.reporter_id === ctx.player.id
        ? match.opponent_id
        : match.reporter_id;
    void sendMatchResolvedPush({
      userId: otherId,
      kind: "approved",
      matchId,
      actorNickname: ctx.player.nickname,
    }).catch(() => {});
  }

  revalidatePath("/inbox");
  revalidatePath("/leaderboard");
  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

export async function disputeMatch(formData: FormData): Promise<void> {
  const ctx = await requireMember();
  const matchId = String(formData.get("matchId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!matchId || reason.length < 3) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_dispute" as never, {
    p_match_id: matchId,
    p_reason: reason,
  } as never);
  if (error) {
    // Form action can't return errors; redirect with query param
    redirect(`/matches/${matchId}?error=${encodeURIComponent(error.message)}`);
  }

  // Notify the other player
  const { data: match } = await supabase
    .from("matches")
    .select("reporter_id, opponent_id")
    .eq("id", matchId)
    .single();
  if (match) {
    const otherId =
      match.reporter_id === ctx.player.id
        ? match.opponent_id
        : match.reporter_id;
    void sendMatchResolvedPush({
      userId: otherId,
      kind: "disputed",
      matchId,
      actorNickname: ctx.player.nickname,
      reason,
    }).catch(() => {});
  }

  revalidatePath("/inbox");
  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}?disputed=1`);
}

export async function cancelMatch(matchId: string): Promise<ActionResult> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_match", {
    p_match_id: matchId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inbox");
  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}
