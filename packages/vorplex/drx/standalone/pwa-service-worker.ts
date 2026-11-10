/// <reference lib="webworker" />
const sw = self as unknown as ServiceWorkerGlobalScope;
const cacheName = 'drx';

async function revalidate(cache: Cache, path: string): Promise<void> {
    const request = new Request(path);
    const cached = await cache.match(request);
    const headers: Record<string, string> = {};
    const etag = cached?.headers.get('ETag');
    const modified = cached?.headers.get('Last-Modified');
    if (etag) headers['If-None-Match'] = etag;
    if (modified) headers['If-Modified-Since'] = modified;
    const response = await fetch(request, { cache: 'no-store', headers });
    if (response.ok) await cache.put(request, response);
}

async function syncCache(): Promise<void> {
    const manifest: { files?: string[] } = await fetch('manifest.json', { cache: 'no-store' })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null);
    if (!manifest?.files) return;
    const paths = ['.', ...manifest.files];
    const cache = await caches.open(cacheName);
    await Promise.all(paths.map(path => revalidate(cache, path).catch(() => undefined)));
    const urls = new Set(paths.map(path => new URL(path, sw.registration.scope).href));
    await Promise.all((await cache.keys()).filter(request => !urls.has(request.url)).map(request => cache.delete(request)));
    await Promise.all((await caches.keys()).filter(key => key !== cacheName).map(key => caches.delete(key)));
}

sw.addEventListener('install', event => { sw.skipWaiting(); event.waitUntil(syncCache()); });
sw.addEventListener('activate', event => { event.waitUntil(sw.clients.claim()); });
sw.addEventListener('message', event => { if (event.data?.type === 'SYNC_CACHE') event.waitUntil(syncCache()); });
sw.addEventListener('fetch', event => { event.respondWith(proxyFetch(event as FetchEvent)); });

async function proxyFetch(event: FetchEvent): Promise<Response> {
    const url = new URL(event.request.url);
    if (url.origin !== sw.location.origin || event.request.method !== 'GET') return fetch(event.request);
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(event.request);
        if (response.ok && await cache.match(event.request)) await cache.put(event.request, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(event.request) ?? (event.request.mode === 'navigate' ? await cache.match('.') : undefined);
        if (cached) return cached;
        throw error;
    }
}
