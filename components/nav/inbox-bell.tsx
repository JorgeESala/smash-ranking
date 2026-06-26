import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Props = {
  playerId: string;
};

export async function InboxBell({ playerId }: Props) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("opponent_id", playerId)
    .eq("status", "pending");

  const pendingCount = count ?? 0;
  const hasNotifications = pendingCount > 0;
  const displayCount = pendingCount > 9 ? "9+" : String(pendingCount);
  const ariaLabel = hasNotifications
    ? `Inbox (${pendingCount} ${pendingCount === 1 ? "partida pendiente" : "partidas pendientes"})`
    : "Inbox";

  return (
    <Link
      href="/inbox"
      aria-label={ariaLabel}
      className="relative inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <span className="relative inline-flex">
        <Bell
          className={
            hasNotifications
              ? "size-4 animate-bell-ring text-primary"
              : "size-4"
          }
        />
        {hasNotifications && (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm shadow-destructive/40"
          >
            {displayCount}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">Inbox</span>
    </Link>
  );
}
