// Cache-first service worker: after the first visit, the page and
// shortcut icons load from the phone's storage instead of the network.
// When you upload a new index.html, change this version (v2, v3, ...)
// so phones pick up the new page.
const CACHE = "home-v2";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./"])));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" && new URL(req.url).origin === location.origin;
  e.respondWith(
    caches.match(isPage ? "./" : req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(isPage ? "./" : req, copy));
        }
        return res;
      });
    })
  );
});
