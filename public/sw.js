const CACHE_VERSION = "boemo-shell-v4";
const SHELL_CACHE = CACHE_VERSION;
const STATIC_LIMIT = 100;
const PUBLIC_PAGE_LIMIT = 12;
const APP_SHELL = ["/", "/order", "/offline", "/icon.svg"];

self.addEventListener("install", (event) => { event.waitUntil(precacheShell()); });
async function precacheShell() {
  const shell = await caches.open(SHELL_CACHE);
  const discovered = new Set();
  for (const path of APP_SHELL) {
    const request = new Request(path, { cache: "reload" });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`BOEMO shell could not cache ${path}`);
    await shell.put(request, response.clone());
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) continue;
    const html = await response.text();
    for (const match of html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)) discovered.add(match[1]);
  }
  await Promise.all([...discovered].map(async (path) => {
    try {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok) await shell.put(request, response);
    } catch {}
  }));
  await trimCache(SHELL_CACHE, STATIC_LIMIT);
}
self.addEventListener("message", (event) => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("boemo-shell-") && key !== SHELL_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  const isNavigation = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/")) { event.respondWith(cacheFirst(request)); return; }
  const isPublicAsset = url.pathname.startsWith("/boemo-assets/") || url.pathname === "/manifest.webmanifest" || /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|webp|svg|ico|avif)$/i.test(url.pathname);
  if (isPublicAsset) { event.respondWith(cacheFirst(request)); return; }
  if (isNavigation) {
    const isPrivate = url.pathname.startsWith("/account") || url.pathname.startsWith("/orders/") || url.pathname.startsWith("/admin");
    event.respondWith(fetch(request).then((response) => {
      if (response.ok && !isPrivate) void caches.open(SHELL_CACHE).then(async (cache) => { await cache.put(request, response.clone()); await trimCache(SHELL_CACHE, PUBLIC_PAGE_LIMIT + STATIC_LIMIT); });
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("/offline")) || Response.error()));
    return;
  }
  event.respondWith(cacheFirst(request));
});
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) { const cache = await caches.open(SHELL_CACHE); await cache.put(request, response.clone()); await trimCache(SHELL_CACHE, STATIC_LIMIT + PUBLIC_PAGE_LIMIT); }
    return response;
  } catch { return Response.error(); }
}
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((request) => cache.delete(request)));
}
