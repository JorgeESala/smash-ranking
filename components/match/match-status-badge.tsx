import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/lib/supabase/types";

const LABELS: Record<MatchStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  disputed: "Disputada",
  cancelled: "Cancelada",
};

const STYLES: Record<MatchStatus, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  approved: "border-success/40 bg-success/10 text-success",
  disputed: "border-destructive/40 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

export function MatchStatusBadge({
  status,
  className,
}: {
  status: MatchStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
