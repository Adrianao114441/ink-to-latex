// Service worker: a tiny proxy the browser runs between the page and the network.
const CACHE = "ink2latex-v3";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png",
  "https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js",
];

// 1) On install, download the core files into the cache.
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

// 2) Delete caches from older versions.
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 3) Every request: answer from the cache if we have it; otherwise fetch it
//    and keep a copy (that is how the Google fonts get saved too).
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit ||
    fetch(e.request).then(res => {
      if (res.ok || res.type === "opaque") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    })));
});
