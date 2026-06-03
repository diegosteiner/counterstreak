/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;
// Everything needed to run the app offline: built JS/CSS, static files, and
// prerendered HTML pages.
const ASSETS = [...build, ...files, ...prerendered];

/** Tell every open client the current time; they reset any counter whose period rolled over. */
async function broadcastTime(): Promise<void> {
	const now = Date.now();
	const clients = await sw.clients.matchAll({ includeUncontrolled: true });
	for (const client of clients) {
		client.postMessage({ type: 'TIME', now });
	}
}

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
	);
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
			await sw.clients.claim();
			await broadcastTime();
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Cache-first for precached assets — instant and works offline.
			const cached = await cache.match(request);
			if (cached) return cached;

			// Otherwise hit the network; fall back to the cached app shell when
			// offline so navigations still resolve.
			try {
				const response = await fetch(request);
				return response;
			} catch (err) {
				const fallback = await cache.match('/');
				if (fallback) return fallback;
				throw err;
			}
		})()
	);
});

// The client asks "what time is it?" on open / focus / interval; we reply.
sw.addEventListener('message', (event) => {
	const data = event.data;
	if (data && data.type === 'GET_TIME') {
		const now = Date.now();
		const source = event.source as Client | null;
		if (source) {
			source.postMessage({ type: 'TIME', now });
		} else {
			broadcastTime();
		}
	}
});
