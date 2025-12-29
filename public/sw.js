// Service Worker for CrashKart
const CACHE_NAME = 'crashkart-offline-v2';
const OFFLINE_URL = '/offline.html';
const LOTTIE_ANIMATION = '/no-connection.json';
const LOTTIE_PLAYER = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';

// Install event - cache the offline page and required assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching offline resources');
            return cache.addAll([
                new Request(OFFLINE_URL, { cache: 'reload' }),
                new Request(LOTTIE_ANIMATION, { cache: 'reload' }),
                new Request(LOTTIE_PLAYER, { cache: 'reload', mode: 'cors' })
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve cached resources when offline
self.addEventListener('fetch', (event) => {
    // Handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If fetch fails, serve the offline page
                return caches.match(OFFLINE_URL);
            })
        );
    } 
    // Handle requests for offline resources (animation, lottie player)
    else if (
        event.request.url.includes('no-connection.json') ||
        event.request.url.includes('lottie-player')
    ) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((fetchResponse) => {
                    // Cache the resource for future offline use
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
});
