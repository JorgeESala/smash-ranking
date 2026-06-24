// Push notification sender. Server-only. No-ops gracefully if VAPID isn't
// configured yet, so the app runs in dev without push keys.
import "server-only";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@yoshos.local";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

type Args =
  | {
      kind: "match_reported";
      matchId: string;
      opponentId: string;
      reporterNickname: string;
      score: string;
    }
  | {
      kind: "match_resolved";
      userId: string;
      matchId: string;
      actorNickname: string;
      reason?: string;
      sub: "approved" | "disputed";
    };

export async function sendPush(args: Args): Promise<void> {
  if (!configure()) return;
  const admin = createServiceClient();

  // Resolve the user_id to notify
  let userId: string | null = null;
  if (args.kind === "match_reported") {
    const { data } = await admin
      .from("players")
      .select("auth_user_id")
      .eq("id", args.opponentId)
      .maybeSingle();
    userId = data?.auth_user_id ?? null;
  } else {
    userId = args.userId;
  }
  if (!userId) return;

  const { data: subs } = await admin
    .from("push_subs")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let title: string;
  let body: string;
  if (args.kind === "match_reported") {
    title = `⚔️  ${args.reporterNickname} reportó una partida`;
    body = `Resultado: ${args.score}. Abre la app para aprobar o disputar.`;
  } else if (args.sub === "approved") {
    title = `✅  ${args.actorNickname} aprobó la partida`;
    body = "Tu ranking se actualizó.";
  } else {
    title = `⚠️  ${args.actorNickname} disputó la partida`;
    body = args.reason ? `"${args.reason.slice(0, 80)}"` : "Revisa el detalle.";
  }

  const json = JSON.stringify({
    title,
    body,
    url: `${siteUrl}/matches/${args.matchId}`,
    tag: `match-${args.matchId}`,
  });

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
        await admin
          .from("push_subs")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", s.id);
      } catch (e: unknown) {
        const err = e as { statusCode?: number };
        if (err.statusCode === 404 || err.statusCode === 410) {
          await admin.from("push_subs").delete().eq("id", s.id);
        } else {
          // Log other errors but don't block the action
          console.error("push send error", err);
        }
      }
    }),
  );
}

// Convenience wrappers used by lib/matches/actions.ts
export async function sendMatchReportedPush(a: {
  matchId: string;
  opponentId: string;
  reporterNickname: string;
  score: string;
}) {
  return sendPush({ kind: "match_reported", ...a });
}

export async function sendMatchResolvedPush(a: {
  userId: string;
  matchId: string;
  actorNickname: string;
  reason?: string;
  kind: "approved" | "disputed";
}) {
  return sendPush({
    kind: "match_resolved",
    userId: a.userId,
    matchId: a.matchId,
    actorNickname: a.actorNickname,
    reason: a.reason,
    sub: a.kind,
  });
}
