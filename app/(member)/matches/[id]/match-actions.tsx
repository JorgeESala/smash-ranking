"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMatch, disputeMatch, cancelMatch } from "@/lib/matches/actions";
import { Button } from "@/components/ui/button";
import { Check, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";

type Props =
  | { mode: "approve-dispute"; matchId: string }
  | { mode: "cancel"; matchId: string };

export function MatchActions(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (props.mode === "cancel") {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          ¿Te equivocaste al reportar? Puedes cancelar mientras esté pendiente.
        </p>
        <Button
          variant="destructive"
          onClick={() =>
            startTransition(async () => {
              const res = await cancelMatch(props.matchId);
              if (res.ok) {
                toast.success("Partida cancelada");
                router.refresh();
              } else {
                toast.error(res.error);
              }
            })
          }
          disabled={pending}
        >
          <X />
          Cancelar partida
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-warning/30 bg-warning/5 p-4">
      <p className="text-sm">
        Apruébalo si los datos están bien. Si algo no coincide, discútelo con
        una razón.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            startTransition(async () => {
              const res = await approveMatch(props.matchId);
              if (res.ok) {
                toast.success("Partida aprobada. Elo actualizado.");
                router.push("/inbox");
              } else {
                toast.error(res.error);
              }
            })
          }
          disabled={pending}
          className="flex-1"
        >
          <Check />
          Aprobar
        </Button>
      </div>

      <form action={disputeMatch} className="space-y-2">
        <input type="hidden" name="matchId" value={props.matchId} />
        <textarea
          name="reason"
          required
          minLength={3}
          maxLength={500}
          placeholder="Razón de la disputa (visible para ambos)"
          className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" variant="destructive" disabled={pending}>
          <ShieldOff />
          Disputar
        </Button>
      </form>
    </div>
  );
}
