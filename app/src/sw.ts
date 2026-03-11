/// <reference lib="webworker" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope;

// Vite base path ("/iot-commander/")
const BASE = import.meta.env.BASE_URL;

// precache assets
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

let allowlist: RegExp[] | undefined;

// dev mode disables full precache
if (import.meta.env.DEV) allowlist = [new RegExp(`^${BASE}$`)];

// SPA navigation fallback
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${BASE}index.html`), {
    allowlist,
  }),
);

self.skipWaiting();
clientsClaim();

/* -----------------------------
   PUSH NOTIFICATION HANDLERS
--------------------------------*/

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const title = data.title || "Notification";

  const options: NotificationOptions = {
    body: data.body,
    icon: `${BASE}pwa-192x192.png`,
    badge: `${BASE}pwa-192x192.png`,
    data: data.url || BASE,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data || BASE;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        return self.clients.openWindow(url);
      }),
  );
});
