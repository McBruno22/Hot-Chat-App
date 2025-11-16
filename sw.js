const CACHE_NAME = "chat-cache-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/admin.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // pentru socket.io și websocket lăsăm rețeaua direct
  if (url.pathname.startsWith("/socket.io")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
