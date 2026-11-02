/* Service Worker — cache offline pentru aplicația „Biblia 365”.
 * Paginile Doxologia (textul biblic) rămân online, dar aplicația în sine
 * (interfața + planul) funcționează și fără internet după prima deschidere.
 */
const CACHE = "biblia365-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./books.js",
  "./plan.js",
  "./icoana.jpg",
  "./manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // doar resursele proprii (același origin) sunt servite din cache;
  // cererile către doxologia.ro trec direct la rețea
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});