// Serwist service worker. Caches the app shell and handles push events.
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

// Push event: show a notification using the payload sent from the server.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
  } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Yoshos", body: event.data.text() };
  }
  const title = payload.title ?? "Yoshos Ranking";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    tag: payload.tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      for (const c of clientsArr) {
        if (c.url.endsWith(url) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
