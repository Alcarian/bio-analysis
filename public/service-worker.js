/* eslint-disable no-restricted-globals */

// This service worker uses a cache-first strategy for static assets
// and network-first for navigation requests (HTML).

const CACHE_NAME = "bio-analysis-v2";

// Install event — ne PAS appeler skipWaiting() automatiquement.
// On attend le message SKIP_WAITING envoyé par l'utilisateur.
self.addEventListener("install", (event) => {
  // On ne précache plus d'URLs absolues (incompatibles avec les sous-chemins GitHub Pages).
  // Les assets seront mis en cache dynamiquement via le fetch handler.
  event.waitUntil(caches.open(CACHE_NAME));
});

// Écoute le message SKIP_WAITING envoyé par UpdateBanner
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate event — nettoie les anciens caches et prend le contrôle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Only handle GET requests from same origin
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Navigation requests (HTML) : network-first pour toujours avoir le dernier index.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches
            .match(event.request)
            .then((cached) => cached || caches.match("/index.html"));
        }),
    );
    return;
  }

  // Static assets (JS, CSS, images) : cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});
