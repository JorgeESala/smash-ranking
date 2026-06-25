"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, X, CheckCircle2 } from "lucide-react";

type Platform = "android" | "ios" | "desktop" | "other";

const DISMISS_KEY = "yoshos_install_dismissed";
const JUST_INSTALLED_KEY = "yoshos_just_installed";
const INSTALL_TOAST_DISMISSED_KEY = "yoshos_install_toast_dismissed";
const INSTALL_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const TOAST_AUTO_DISMISS_MS = 12_000;

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
  const [justInstalled, setJustInstalled] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);

  useEffect(() => {
    const detected = detectPlatform();
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setShow(false);
      // Signal the post-install notification prompt to show on next page
      // load. We store a timestamp so it can expire if the user doesn't
      // open the app within 24h of installing.
      localStorage.setItem(JUST_INSTALLED_KEY, Date.now().toString());
      // Show the "you installed it!" confirmation toast — but only if
      // the user hasn't dismissed it before.
      if (localStorage.getItem(INSTALL_TOAST_DISMISSED_KEY) !== "1") {
        setJustInstalled(true);
      }
    };

    queueMicrotask(() => {
      setPlatform(detected);

      if (window.matchMedia("(display-mode: standalone)").matches) {
        // Already installed (e.g. opened from home screen) — also flag
        // the post-install prompt so the user gets the notifications
        // onboarding once if they haven't seen it yet.
        const existing = localStorage.getItem(JUST_INSTALLED_KEY);
        const expired =
          !existing || Date.now() - parseInt(existing, 10) > INSTALL_TTL_MS;
        if (expired) {
          localStorage.setItem(JUST_INSTALLED_KEY, Date.now().toString());
        }
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

  // Auto-dismiss the install toast after TOAST_AUTO_DISMISS_MS
  useEffect(() => {
    if (!justInstalled) return;
    const timer = setTimeout(() => {
      setJustInstalled(false);
      localStorage.setItem(INSTALL_TOAST_DISMISSED_KEY, "1");
    }, TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [justInstalled]);

  // If user landed here already-installed (e.g. opened from home
  // screen on a fresh visit) and never saw the toast, don't render
  // anything.
  if (installed && !justInstalled) return null;
  if (!show && !justInstalled) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  function dismissToast() {
    localStorage.setItem(INSTALL_TOAST_DISMISSED_KEY, "1");
    setJustInstalled(false);
  }

  // Post-install confirmation toast — shown briefly after the browser
  // install dialog resolves successfully. Tells the user where to find
  // the PWA so they don't think "nothing happened".
  if (justInstalled) {
    const isIOS =
      platform === "ios" || /iPad|iPhone|iPod/.test(navigator.userAgent);
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-success/40 bg-card p-4 shadow-neon-success animate-slide-up-fade"
      >
        <button
          onClick={dismissToast}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10 border border-success/30">
            <CheckCircle2 className="size-5 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-bold text-success">
              ¡Yoshos instalado!
            </h3>
            <p className="text-sm text-muted-foreground">
              {isIOS
                ? "Ya podés abrirlo desde tu pantalla de inicio. Tocá el icono Yoshos para entrar."
                : "Abrilo desde tu pantalla de inicio para usar la app completa (sin barra del navegador)."}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Te vamos a pedir permiso para enviarte notificaciones en
              cuanto lo abras.
            </p>
          </div>
        </div>
      </div>
    );
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
    // Hide our banner immediately so the user isn't staring at two
    // dialogs at once (ours + the browser's native install UI).
    setShow(false);
    await deferred.prompt();
    await deferred.userChoice;
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
