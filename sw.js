// Service Worker pour DestriMed
const CACHE_NAME = 'destrimed-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets à mettre en cache lors de l'installation
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/script.js',
  '/scripts/main.js',
  '/scripts/xlsx.full.min.js',
  '/scripts/jspdf.umd.min.js',
  '/scripts/jspdf.plugin.autotable.min.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/offline.html'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache des ressources statiques');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation terminée');
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation...');
  
  // Nettoyage des anciens caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation terminée');
      return self.clients.claim();
    })
  );
});

// Stratégie de cache: Network First avec fallback au cache
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes de chrome-extension
  if (event.request.url.includes('chrome-extension')) return;
  
  // Pour les API ou données dynamiques, utiliser Network First
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Pour les ressources statiques, utiliser Cache First
  event.respondWith(cacheFirstStrategy(event.request));
});

// Stratégie Cache First
async function cacheFirstStrategy(request) {
  try {
    // Essayer d'abord le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Sinon, aller sur le réseau
    const networkResponse = await fetch(request);
    
    // Mettre en cache la nouvelle ressource
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Erreur réseau, fallback au cache:', error);
    
    // Pour les pages HTML, retourner la page offline
    if (request.headers.get('Accept').includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match(OFFLINE_URL);
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Pour les autres ressources, retourner une réponse d'erreur
    return new Response('Ressource non disponible hors ligne', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Stratégie Network First
async function networkFirstStrategy(request) {
  try {
    // Essayer d'abord le réseau
    const networkResponse = await fetch(request);
    
    // Mettre à jour le cache
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Erreur réseau, utilisation du cache:', error);
    
    // Fallback au cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Données non disponibles hors ligne', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Gestion des messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});