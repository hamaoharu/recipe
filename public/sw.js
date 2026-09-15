self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Chrome のホーム画面追加条件を満たすための fetch。HTML や API はキャッシュしない。
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
