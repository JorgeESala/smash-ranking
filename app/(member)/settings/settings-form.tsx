"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateNickname } from "@/lib/player/actions";
import { toast } from "sonner";

type Props = { currentNickname: string };

export function SettingsForm({ currentNickname }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await updateNickname(fd);
          if (res.ok) {
            toast.success("Nickname actualizado");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
      className="space-y-3"
    >
      <div className="space-y-2">
        <Label htmlFor="nickname">Nuevo nickname</Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          maxLength={24}
          defaultValue={currentNickname}
        />
        <p className="text-xs text-muted-foreground">
          2 a 24 caracteres. Debe ser único.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
