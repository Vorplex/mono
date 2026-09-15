/// <reference lib="webworker" />
const sw = self as unknown as ServiceWorkerGlobalScope;

async function syncCache(): Promise<void> {
    const manifest: { hash?: string; files?: string[] } = await fetch('manifest.json', { cache: 'no-store' })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null);
    if (!manifest?.hash || !manifest?.files) return;
    const existing = await caches.keys();
    if (existing.includes(manifest.hash)) return;
    const cache = await caches.open(manifest.hash);
    await cache.addAll(['.', ...manifest.files]);
    await Promise.all(existing.filter(key => key !== manifest.hash).map(key => caches.delete(key)));
}

sw.addEventListener('install', event => { sw.skipWaiting(); event.waitUntil(syncCache()); });
sw.addEventListener('activate', event => { event.waitUntil(sw.clients.claim()); });
sw.addEventListener('message', event => { if (event.data?.type === 'SYNC_CACHE') event.waitUntil(syncCache()); });
sw.addEventListener('fetch', event => { event.respondWith(proxyFetch(event as FetchEvent)); });

async function proxyFetch(event: FetchEvent): Promise<Response> {
    const url = new URL(event.request.url);
    if (url.origin !== sw.location.origin) return fetch(event.request);
    if (event.request.mode === 'navigate') {
        const shell = await caches.match('.');
        if (shell) return shell;
    }
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return fetch(event.request);
}
