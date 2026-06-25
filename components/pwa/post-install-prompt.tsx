"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Zap, ShieldCheck, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const JUST_INSTALLED_KEY = "yoshos_just_installed";
const DISMISSED_KEY = "yoshos_post_install_dismissed";
const INSTALL_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function PostInstallPrompt() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show on the settings page — that already has the
    // notification opt-in UI, showing the modal on top would be
    // redundant.
    if (window.location.pathname.startsWith("/settings")) return;

    // Check the install flag set by InstallPrompt on appinstalled
    const installedAt = localStorage.getItem(JUST_INSTALLED_KEY);
    if (!installedAt) return;

    // Expired? Clear and bail
    const ts = parseInt(installedAt, 10);
    if (Number.isNaN(ts) || Date.now() - ts > INSTALL_TTL_MS) {
      localStorage.removeItem(JUST_INSTALLED_KEY);
      return;
    }

    // Already dismissed or activated → clear flag, bail
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    // Browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      localStorage.removeItem(JUST_INSTALLED_KEY);
      return;
    }

    // Notification permission already decided → clear flag
    if (Notification.permission !== "default") {
      localStorage.removeItem(JUST_INSTALLED_KEY);
      return;
    }

    // Wait for authenticated session, then show. Use a small delay so
    // the page paints first and the modal lands on a calm surface.
    let unsub: (() => void) | null = null;
    const show = () => {
      // One more tick so the layout settles
      setTimeout(() => setVisible(true), 400);
    };

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        show();
        return;
      }
      // Not logged in yet — wait for sign-in
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          unsub?.();
          show();
        }
      });
      unsub = () => data.subscription.unsubscribe();
    });

    return () => {
      unsub?.();
    };
  }, []);

  async function activate() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Permiso denegado");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("VAPID no configurado en el servidor");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(await res.text());

      // Success — clear both flags so it never shows again
      localStorage.removeItem(JUST_INSTALLED_KEY);
      localStorage.setItem(DISMISSED_KEY, "1");
      setVisible(false);
      toast.success("Notificaciones activadas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al activar");
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  function goToSettings() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    router.push("/settings");
  }

  // Escape key to close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-install-title"
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-neon-primary animate-slide-up-fade">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse-neon" />
            <div className="relative inline-flex size-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <Bell className="size-10 text-neon-primary animate-bell-ring" />
            </div>
          </div>

          <h2
            id="post-install-title"
            className="mb-2 font-mono text-2xl font-bold text-neon-primary"
          >
            ¡Activa las notificaciones!
          </h2>

          <p className="mb-5 text-sm text-muted-foreground">
            Te avisaremos al instante cuando alguien te reporte una partida. Así
            puedes aprobar o disputar sin abrir la app.
          </p>

          <ul className="mb-6 w-full space-y-2.5 text-left text-sm">
            <Feature icon={<Zap className="size-4 text-primary" />}>
              Aviso inmediato al reportar una partida
            </Feature>
            <Feature icon={<ShieldCheck className="size-4 text-secondary" />}>
              Aprueba o disputa con un toque
            </Feature>
            <Feature icon={<Activity className="size-4 text-accent" />}>
              Tu Elo se actualiza en tiempo real
            </Feature>
          </ul>

          <Button
            onClick={activate}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            <Bell />
            {loading ? "Activando…" : "Activar notificaciones"}
          </Button>

          <div className="mt-3 flex w-full items-center justify-center gap-3 text-xs text-muted-foreground">
            <button
              onClick={dismiss}
              className="hover:text-foreground transition-colors"
            >
              Quizás después
            </button>
            <span aria-hidden>·</span>
            <button
              onClick={goToSettings}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Settings className="size-3" />
              Ir a Ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}
