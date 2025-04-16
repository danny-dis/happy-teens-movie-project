/**
 * Service Worker for Movo
 * Provides offline support, caching, and background sync
 * 
 * @author zophlic
 */

// Cache names
const STATIC_CACHE_NAME = 'movo-static-v1';
const DYNAMIC_CACHE_NAME = 'movo-dynamic-v1';
const MEDIA_CACHE_NAME = 'movo-media-v1';
const API_CACHE_NAME = 'movo-api-v1';

// Cache limits
const DYNAMIC_CACHE_LIMIT = 100;
const MEDIA_CACHE_LIMIT = 50;
const API_CACHE_LIMIT = 200;

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/static/js/main.bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/offline.html'
];

// API routes to cache
const API_ROUTES = [
  '/api/media',
  '/api/genres',
  '/api/trending'
];

// Install event handler
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Cache static resources
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(STATIC_RESOURCES);
      })
      .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event handler
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (
            key !== STATIC_CACHE_NAME &&
            key !== DYNAMIC_CACHE_NAME &&
            key !== MEDIA_CACHE_NAME &&
            key !== API_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle media requests
  if (
    url.pathname.includes('/media/') ||
    url.pathname.includes('/videos/') ||
    url.pathname.includes('/images/')
  ) {
    event.respondWith(handleMediaRequest(event.request));
    return;
  }
  
  // Handle static assets
  if (
    url.pathname.startsWith('/static/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname.includes('/logo')
  ) {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }
  
  // Handle all other requests
  event.respondWith(handleDynamicRequest(event.request));
});

// Background sync event handler
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync:', event);
  
  if (event.tag === 'sync-watch-progress') {
    event.waitUntil(syncWatchProgress());
  }
});

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Notification received:', event);
  
  let data = { title: 'New Notification', body: 'Something new happened!' };
  
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge.png',
    data: data.data,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  if (event.action) {
    // Handle action click
    console.log('[Service Worker] Action clicked:', event.action);
    
    // Handle specific actions
    switch (event.action) {
      case 'open':
        // Open specific URL
        if (event.notification.data && event.notification.data.url) {
          event.waitUntil(
            clients.openWindow(event.notification.data.url)
          );
        }
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Handle other actions
        break;
    }
  } else {
    // Handle notification click
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // Check if a window is already open
          for (const client of clientList) {
            if (client.url.includes('/') && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

/**
 * Handle API requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Fetch response
 */
async function handleApiRequest(request) {
  // Check if request should be cached
  const shouldCache = API_ROUTES.some(route => request.url.includes(route));
  
  // Network first, then cache
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (shouldCache && request.method === 'GET' && response.status === 200) {
      const responseToCache = response.clone();
      caches.open(API_CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
          
          // Trim cache if needed
          trimCache(API_CACHE_NAME, API_CACHE_LIMIT);
        });
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] API fetch failed, falling back to cache:', error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline API response
    return new Response(
      JSON.stringify({
        error: 'You are offline',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle media requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Fetch response
 */
async function handleMediaRequest(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const responseToCache = response.clone();
      caches.open(MEDIA_CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
          
          // Trim cache if needed
          trimCache(MEDIA_CACHE_NAME, MEDIA_CACHE_LIMIT);
        });
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Media fetch failed:', error);
    
    // Return placeholder image for image requests
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return caches.match('/static/images/placeholder.png');
    }
    
    // Return error response for other media
    return new Response(
      'Media not available offline',
      {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

/**
 * Handle static requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Fetch response
 */
async function handleStaticRequest(request) {
  // Cache first, then network
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const responseToCache = response.clone();
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
        });
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Static fetch failed:', error);
    
    // Return placeholder for images
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return caches.match('/static/images/placeholder.png');
    }
    
    // Return empty response for other static assets
    return new Response(
      '',
      {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

/**
 * Handle navigation requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Fetch response
 */
async function handleNavigationRequest(request) {
  // Try network first
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[Service Worker] Navigation fetch failed, falling back to cache:', error);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page
    return caches.match('/offline.html');
  }
}

/**
 * Handle dynamic requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Fetch response
 */
async function handleDynamicRequest(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.status === 200) {
      const responseToCache = response.clone();
      caches.open(DYNAMIC_CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
          
          // Trim cache if needed
          trimCache(DYNAMIC_CACHE_NAME, DYNAMIC_CACHE_LIMIT);
        });
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Dynamic fetch failed:', error);
    
    // Return appropriate fallback
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    // Return empty response for other requests
    return new Response(
      '',
      {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

/**
 * Trim cache to limit
 * @param {string} cacheName - Cache name
 * @param {number} maxItems - Maximum number of items
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    console.log(`[Service Worker] Trimming cache ${cacheName} (${keys.length} > ${maxItems})`);
    
    // Delete oldest items
    const itemsToDelete = keys.length - maxItems;
    for (let i = 0; i < itemsToDelete; i++) {
      await cache.delete(keys[i]);
    }
    
    console.log(`[Service Worker] Deleted ${itemsToDelete} items from ${cacheName}`);
  }
}

/**
 * Sync watch progress
 * @returns {Promise<void>}
 */
async function syncWatchProgress() {
  // Get data from IndexedDB
  const db = await openDatabase();
  const tx = db.transaction('sync-watch-progress', 'readonly');
  const store = tx.objectStore('sync-watch-progress');
  const items = await store.getAll();
  
  if (items.length === 0) {
    return;
  }
  
  console.log('[Service Worker] Syncing watch progress:', items);
  
  // Send data to server
  try {
    const response = await fetch('/api/sync/watch-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': items[0].token // Assume all items have the same token
      },
      body: JSON.stringify({
        items: items.map(item => ({
          mediaId: item.mediaId,
          progress: item.progress,
          timestamp: item.timestamp
        }))
      })
    });
    
    if (response.ok) {
      // Clear synced items
      const tx = db.transaction('sync-watch-progress', 'readwrite');
      const store = tx.objectStore('sync-watch-progress');
      await Promise.all(items.map(item => store.delete(item.id)));
      
      console.log('[Service Worker] Watch progress synced successfully');
    } else {
      console.error('[Service Worker] Failed to sync watch progress:', await response.text());
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing watch progress:', error);
    // Will retry on next sync event
  }
}

/**
 * Open IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('movo-db', 1);
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('sync-watch-progress')) {
        db.createObjectStore('sync-watch-progress', { keyPath: 'id' });
      }
    };
  });
}
