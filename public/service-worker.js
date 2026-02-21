/* eslint-disable no-restricted-globals */

// This service worker uses a cache-first strategy for static assets
// and network-first for navigation requests (HTML).

const CACHE_NAME = "bio-analysis-v3";

// Assets critiques avec des noms stables (sans hash) à pré-cacher dès l'installation.
// Cela garantit leur disponibilité hors ligne même si l'utilisateur
// n'a jamais utilisé ces fonctionnalités en ligne auparavant.
const PRECACHE_URLS = [
  "./", // index.html (alias racine)
  "./index.html",
  "./pdf.worker.min.mjs", // worker PDF.js — chargé seulement lors du 1er PDF
];

// Install event — ne PAS appeler skipWaiting() automatiquement.
// On attend le message SKIP_WAITING envoyé par l'utilisateur.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pré-cache les assets critiques à nom stable.
      // On utilise { cache: 'reload' } pour ignorer le cache HTTP du navigateur.
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })),
        ),
      );
    }),
  );
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
