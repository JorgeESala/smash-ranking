"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, X } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "yoshos_push_dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushPrompt() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">(
    "unknown",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    queueMicrotask(() => {
      setSupported(ok);
      if (!ok) return;
      setPermission(Notification.permission);
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    });
  }, []);

  async function subscribe() {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Permiso denegado");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("VAPID no configurado");
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
      setSubscribed(true);
      toast.success("Notificaciones activadas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al activar");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setSubscribed(false);
      toast.success("Notificaciones desactivadas");
    } finally {
      setLoading(false);
    }
  }

  if (supported === null) return null;
  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu navegador no soporta notificaciones push.
      </p>
    );
  }

  if (subscribed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/5 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-success" />
          Notificaciones activadas
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={unsubscribe}
          disabled={loading}
        >
          <BellOff />
          Desactivar
        </Button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Notificaciones bloqueadas. Actívalas desde los ajustes de tu navegador.
      </p>
    );
  }

  if (dismissed) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Notificaciones desactivadas.</p>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(false)}>
          <Bell />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Recibe un push cuando alguien te reporte una partida. Disponible en
        Android (Chrome) y iOS (tras agregar a pantalla de inicio).
      </p>
      <div className="flex gap-2">
        <Button onClick={subscribe} disabled={loading}>
          <Bell />
          {loading ? "Activando…" : "Activar notificaciones"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
        >
          <X />
          Ahora no
        </Button>
      </div>
    </div>
  );
}
