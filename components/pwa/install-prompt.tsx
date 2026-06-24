"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, X } from "lucide-react";

type Platform = "android" | "ios" | "desktop" | "other";

const DISMISS_KEY = "yoshos_install_dismissed";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua))
    return "ios";
  return "desktop";
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(() => "other");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const detected = detectPlatform();
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => setInstalled(true);

    queueMicrotask(() => {
      setPlatform(detected);

      if (window.matchMedia("(display-mode: standalone)").matches) {
        setInstalled(true);
        return;
      }

      if (localStorage.getItem(DISMISS_KEY) === "1") return;

      window.addEventListener("beforeinstallprompt", handler);
      window.addEventListener("appinstalled", onInstalled);

      if (detected === "ios") {
        setShow(true);
      }
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (platform === "ios") {
    return (
      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-neon-primary">
        <button
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        <h3 className="mb-1 font-bold">Instala Yoshos</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Toca <Share className="inline size-3" /> y luego{" "}
          <strong>&ldquo;Añadir a pantalla de inicio&rdquo;</strong>{" "}
          <Plus className="inline size-3" /> para recibir notificaciones.
        </p>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Entendido
        </Button>
      </div>
    );
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-neon-primary">
      <button
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </button>
      <h3 className="mb-1 font-bold">Instala Yoshos</h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Acceso rápido y notificaciones push.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={install} disabled={!deferred}>
          <Download />
          {deferred ? "Instalar" : "Disponible pronto"}
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
