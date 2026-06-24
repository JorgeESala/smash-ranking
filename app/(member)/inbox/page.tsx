import { InboxList } from "./inbox-list";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/require-member";
import { Inbox } from "lucide-react";

export const metadata = { title: "Inbox" };

export default async function InboxPage() {
  const ctx = await requireMember("/inbox");
  const supabase = await createClient();

  // Initial fetch (client component subscribes for realtime updates)
  const { data: pending } = await supabase
    .from("matches")
    .select(
      "id, winner_score, loser_score, format, created_at, reporter:players!reporter_id(id, nickname, avatar_url), opponent:players!opponent_id(id, nickname, avatar_url), winner:players!winner_id(nickname)",
    )
    .eq("opponent_id", ctx.player.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <Inbox className="size-7 text-primary" />
        <div>
          <h1 className="font-mono text-3xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Partidas que esperan tu aprobación
          </p>
        </div>
      </header>

      <InboxList
        initialMatches={(pending ?? []) as never}
        currentPlayerId={ctx.player.id}
      />
    </main>
  );
}
