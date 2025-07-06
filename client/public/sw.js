const CACHE_NAME = 'mumalieff-v1.0.0';
const STATIC_CACHE = 'mumalieff-static-v1';
const API_CACHE = 'mumalieff-api-v1';
const IMAGE_CACHE = 'mumalieff-images-v1';

const STATIC_ASSETS = [
  '/',
  '/images/logo-black.svg',
  '/images/logo-white.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        const promises = STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset);
            if (response.ok) {
              return cache.put(asset, response);
            }
          } catch (error) {
          }
        });
        
        await Promise.allSettled(promises);
        return self.skipWaiting();
      })
      .catch((error) => {
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    if (isApiRequest(url)) {
      return await networkFirstAPI(request);
    }
    
    if (isImageRequest(url)) {
      return await staleWhileRevalidateImages(request);
    }
    
    if (isNavigationRequest(request)) {
      return await networkFirstNavigation(request);
    }
    
    return await fetch(request);
    
  } catch (error) {
    return new Response('Service Worker Error', { status: 500 });
  }
}

async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return fetch(request);
  }
}

async function networkFirstAPI(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  } catch (error) {
    return new Response('API Error', { status: 503 });
  }
}

async function staleWhileRevalidateImages(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    const networkPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => null);
    
    return cachedResponse || networkPromise;
  } catch (error) {
    return fetch(request);
  }
}

async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    try {
      const cache = await caches.open(STATIC_CACHE);
      const cachedResponse = await cache.match('/');
      return cachedResponse || new Response('Offline', { status: 503 });
    } catch (cacheError) {
      return new Response('Offline', { status: 503 });
    }
  }
}

function isStaticAsset(url) {
  return url.pathname.includes('/static/') ||
         url.pathname.includes('.css') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('/fonts/') ||
         STATIC_ASSETS.some(asset => url.pathname === asset);
}

function isApiRequest(url) {
  return url.pathname.includes('/api/');
}

function isImageRequest(url) {
  return /\.(?:png|jpg|jpeg|svg|webp|gif)$/.test(url.pathname) ||
         url.hostname.includes('cloudinary.com');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && 
          request.headers.get('accept') && 
          request.headers.get('accept').includes('text/html'));
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});