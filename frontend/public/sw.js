/*
 * Le cache sert l'interface déjà consultée hors ligne. Les requêtes API restent
 * volontairement hors du cache : les données métier sont conservées dans
 * IndexedDB puis synchronisées explicitement à la reconnexion.
 */
// Incrémentez cette version à chaque livraison qui modifie le code client :
// les scripts sont servis cache-first afin que Doku reste utilisable hors ligne.
const CACHE_NAME = "doku-shell-v3";
const OFFLINE_PAGE = "/offline";
const APP_SHELL = [OFFLINE_PAGE, "/manifest.webmanifest", "/icons/doku-192.png", "/icons/doku-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("doku-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_PAGE)) || Response.error()));
    return;
  }

  if (["script", "style", "font", "image"].includes(request.destination)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    })));
  }
});
