import { requireMember } from "@/lib/auth/require-member";
import { SettingsForm } from "./settings-form";
import { PushPrompt } from "@/components/pwa/push-prompt";
import { Settings as SettingsIcon } from "lucide-react";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const ctx = await requireMember("/settings");

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <SettingsIcon className="size-7 text-primary" />
        <h1 className="font-mono text-3xl font-bold">Ajustes</h1>
      </header>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-bold">Notificaciones push</h2>
          <PushPrompt />
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-bold">Nickname</h2>
          <SettingsForm
            currentNickname={ctx.player.nickname}
          />
        </section>
      </div>
    </main>
  );
}
