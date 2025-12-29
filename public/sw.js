// Service Worker for CrashKart
const CACHE_NAME = 'crashkart-offline-v3';
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
            fetch(event.request).catch((error) => {
                // Only serve offline page if the user is actually offline
                // Check if it's a network error (not a 404 or other HTTP error)
                if (!navigator.onLine || error.message.includes('Failed to fetch')) {
                    return caches.match(OFFLINE_URL);
                }
                // For other errors (like 404, 500), let the error propagate
                return new Response('Network error', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
        );
    } 
    // Handle requests for offline resources (animation, lottie player)
    else if (
        event.request.url.includes('no-connection.json') ||
        event.request.url.includes('lottie-player') ||
        event.request.url.includes('/animations/')
    ) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then((fetchResponse) => {
                    // Cache the resource for future use
                    if (fetchResponse.ok) {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, fetchResponse.clone());
                            return fetchResponse;
                        });
                    }
                    return fetchResponse;
                }).catch(() => {
                    // If offline and not in cache, return empty response
                    return new Response('', { status: 408 });
                });
            })
        );
    }
});
