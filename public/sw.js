// Service Worker for CrashKart
const CACHE_NAME = 'crashkart-offline-v1';
const OFFLINE_URL = '/offline.html';

// Install event - cache the offline page
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching offline page');
            return cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
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

// Fetch event - serve offline page when network fails
self.addEventListener('fetch', (event) => {
    // Only handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If fetch fails, serve the offline page
                return caches.match(OFFLINE_URL);
            })
        );
    }
});
