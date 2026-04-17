// MyFinance Service Worker - Protegido con Login
const CACHE_NAME = 'myfinance-v1';
const urlsToCache = [
    '.',
    './index.html',
    './manifest.json'
];

// Instalación: cachear recursos esenciales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Error al cachear:', err))
    );
    self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: estrategia Cache First, luego Network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - retornar respuesta
                if (response) {
                    return response;
                }

                // Clonar la petición
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Verificar respuesta válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar la respuesta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
            .catch(() => {
                // Fallback si todo falla
                console.log('Fetch falló, usando cache o fallback');
            })
    );
});