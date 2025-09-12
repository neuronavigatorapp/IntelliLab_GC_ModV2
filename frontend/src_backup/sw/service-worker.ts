const CACHE_NAME = 'intellilab-gc-v1';
const STATIC_CACHE_NAME = 'intellilab-gc-static-v1';
const DYNAMIC_CACHE_NAME = 'intellilab-gc-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo192.png',
  '/logo512.png',
  '/manifest.webmanifest'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/v1/instruments',
  '/api/v1/methods',
  '/api/v1/inventory',
  '/api/v1/qc',
  '/api/v1/sync/status'
];

// Install event - cache static files
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return (self as any).skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames: string[]) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return (self as any).clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static files
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests (POST, PUT, etc.)
  event.respondWith(handleOtherRequest(request));
});

async function handleApiRequest(request: Request): Promise<Response> {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If offline, try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache and offline, return offline response
    return new Response(
      JSON.stringify({ error: 'Offline - no cached data available' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleStaticRequest(request: Request): Promise<Response> {
  // Try cache first for static files
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/index.html');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}

async function handleOtherRequest(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    // For POST/PUT requests, queue for background sync
    if (request.method === 'POST' || request.method === 'PUT') {
      // Store in IndexedDB for background sync
      await storeRequestForSync(request);
      return new Response(
        JSON.stringify({ message: 'Request queued for sync when online' }),
        { 
          status: 202, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    throw error;
  }
}

// Background sync for queued requests
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Push notifications
self.addEventListener('push', (event: any) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from IntelliLab GC',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    (self as any).registration.showNotification('IntelliLab GC', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      (self as any).clients.openWindow('/')
    );
  }
});

// Helper functions
async function storeRequestForSync(request: Request): Promise<void> {
  // This would store the request in IndexedDB for later sync
  // Implementation depends on the specific sync strategy
  console.log('Storing request for background sync:', request.url);
}

async function syncQueuedRequests(): Promise<void> {
  // This would process queued requests when back online
  console.log('Processing queued requests');
  // Implementation would read from IndexedDB and send requests
}

// Message handling for communication with main thread
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  }
});

// Export to make this a module
export {};
