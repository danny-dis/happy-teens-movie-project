/**
 * Movo Service Worker
 * Handles caching and offline support
 * 
 * @author zophlic
 */

// Cache names
const STATIC_CACHE_NAME = 'movo-static-v1';
const DYNAMIC_CACHE_NAME = 'movo-dynamic-v1';
const MEDIA_CACHE_NAME = 'movo-media-v1';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/static/media/logo.png',
  '/static/media/placeholder.jpg',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// Max items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 100;

// Max size for media cache (100MB)
const MAX_MEDIA_CACHE_SIZE = 100 * 1024 * 1024;

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
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

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to take control immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (
            key !== STATIC_CACHE_NAME && 
            key !== DYNAMIC_CACHE_NAME &&
            key !== MEDIA_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip analytics requests
  if (url.pathname.includes('/analytics') || url.hostname.includes('analytics')) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(event);
  }
  
  // Handle media requests
  if (
    url.pathname.includes('/media/') || 
    url.pathname.includes('/stream/') ||
    isMediaFile(url.pathname)
  ) {
    return handleMediaRequest(event);
  }
  
  // Handle static assets
  return handleStaticRequest(event);
});

// Handle static asset requests (HTML, CSS, JS, images)
function handleStaticRequest(event) {
  const request = event.request;
  
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then(networkResponse => {
            // Cache a copy of the response in dynamic cache
            return caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                // Clone the response since it can only be consumed once
                cache.put(request, networkResponse.clone());
                
                // Limit cache size
                limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_ITEMS);
                
                return networkResponse;
              });
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // If the request is for an HTML page, return the offline page
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // For other resources, just fail
            return new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
}

// Handle API requests
function handleApiRequest(event) {
  const request = event.request;
  
  // Network first, then cache
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // Only cache successful responses
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        
        return networkResponse;
      })
      .catch(error => {
        console.log('[Service Worker] API fetch failed, trying cache:', error);
        
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // Add a header to indicate this is from cache
              const headers = new Headers(cachedResponse.headers);
              headers.append('X-Movo-Cache', 'true');
              
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
              });
            }
            
            // If no cached response, return error
            return new Response(JSON.stringify({
              error: 'Network error',
              offline: true,
              message: 'You are offline and this data is not cached.'
            }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            });
          });
      })
  );
}

// Handle media requests
function handleMediaRequest(event) {
  const request = event.request;
  
  // Check if this is a request for a media file that should be cached
  const shouldCache = shouldCacheMedia(request.url);
  
  if (shouldCache) {
    // Cache first, then network
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response and update cache in background
            updateMediaCacheInBackground(request);
            return cachedResponse;
          }
          
          // If not in cache, fetch from network
          return fetch(request)
            .then(networkResponse => {
              // Cache the response
              const responseToCache = networkResponse.clone();
              
              caches.open(MEDIA_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                  
                  // Limit media cache size
                  limitMediaCacheSize(MAX_MEDIA_CACHE_SIZE);
                });
              
              return networkResponse;
            })
            .catch(error => {
              console.error('[Service Worker] Media fetch failed:', error);
              
              // Return placeholder for images
              if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return caches.match('/static/media/placeholder.jpg');
              }
              
              // For other media, return error
              return new Response('Media not available offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  } else {
    // For media that shouldn't be cached, use network only
    event.respondWith(
      fetch(request)
        .catch(error => {
          console.error('[Service Worker] Media fetch failed:', error);
          
          // Return placeholder for images
          if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return caches.match('/static/media/placeholder.jpg');
          }
          
          // For other media, return error
          return new Response('Media not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        })
    );
  }
}

// Update media cache in background
function updateMediaCacheInBackground(request) {
  setTimeout(() => {
    fetch(request)
      .then(networkResponse => {
        caches.open(MEDIA_CACHE_NAME)
          .then(cache => {
            cache.put(request, networkResponse);
          });
      })
      .catch(error => {
        console.log('[Service Worker] Background update failed:', error);
      });
  }, 1000);
}

// Check if a URL is a media file
function isMediaFile(url) {
  return /\.(mp4|webm|ogg|mp3|wav|flac|jpg|jpeg|png|gif|webp)$/i.test(url);
}

// Check if media should be cached
function shouldCacheMedia(url) {
  // Parse URL
  const parsedUrl = new URL(url);
  
  // Check for cache control header in the URL parameters
  if (parsedUrl.searchParams.has('cache') && parsedUrl.searchParams.get('cache') === 'false') {
    return false;
  }
  
  // Check for specific paths that indicate downloadable content
  if (
    parsedUrl.pathname.includes('/downloads/') || 
    parsedUrl.pathname.includes('/offline/') ||
    parsedUrl.searchParams.has('download')
  ) {
    return true;
  }
  
  // Don't cache streaming content by default
  if (parsedUrl.pathname.includes('/stream/')) {
    return false;
  }
  
  // Cache thumbnails and posters
  if (
    parsedUrl.pathname.includes('/thumbnails/') || 
    parsedUrl.pathname.includes('/posters/')
  ) {
    return true;
  }
  
  // Default to not caching media files
  return false;
}

// Limit cache size by number of items
function limitCacheSize(cacheName, maxItems) {
  caches.open(cacheName)
    .then(cache => {
      cache.keys()
        .then(keys => {
          if (keys.length > maxItems) {
            // Delete oldest items (first in, first out)
            cache.delete(keys[0])
              .then(() => limitCacheSize(cacheName, maxItems));
          }
        });
    });
}

// Limit media cache size by total size
function limitMediaCacheSize(maxSize) {
  caches.open(MEDIA_CACHE_NAME)
    .then(async cache => {
      const keys = await cache.keys();
      let totalSize = 0;
      
      // Calculate total size
      for (const request of keys) {
        const response = await cache.match(request);
        const blob = await response.blob();
        totalSize += blob.size;
      }
      
      // If over limit, delete oldest items
      if (totalSize > maxSize) {
        cache.delete(keys[0])
          .then(() => limitMediaCacheSize(maxSize));
      }
    });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync:', event.tag);
  
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  } else if (event.tag === 'sync-ratings') {
    event.waitUntil(syncRatings());
  }
});

// Sync watchlist changes
function syncWatchlist() {
  return fetch('/api/sync/watchlist')
    .then(response => {
      if (!response.ok) {
        throw new Error('Watchlist sync failed');
      }
      return response.json();
    })
    .then(data => {
      console.log('[Service Worker] Watchlist synced successfully:', data);
      
      // Notify the user
      return self.registration.showNotification('Movo', {
        body: 'Your watchlist has been synced',
        icon: '/static/media/logo.png',
        badge: '/static/media/badge.png'
      });
    })
    .catch(error => {
      console.error('[Service Worker] Watchlist sync error:', error);
    });
}

// Sync ratings changes
function syncRatings() {
  return fetch('/api/sync/ratings')
    .then(response => {
      if (!response.ok) {
        throw new Error('Ratings sync failed');
      }
      return response.json();
    })
    .then(data => {
      console.log('[Service Worker] Ratings synced successfully:', data);
      
      // Notify the user
      return self.registration.showNotification('Movo', {
        body: 'Your ratings have been synced',
        icon: '/static/media/logo.png',
        badge: '/static/media/badge.png'
      });
    })
    .catch(error => {
      console.error('[Service Worker] Ratings sync error:', error);
    });
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received:', event);
  
  let data = { title: 'Movo', body: 'New content available' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/static/media/logo.png',
    badge: '/static/media/badge.png',
    data: data.data || {},
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  // Handle notification click
  if (event.action) {
    // Handle specific actions
    switch (event.action) {
      case 'view':
        if (event.notification.data && event.notification.data.url) {
          clients.openWindow(event.notification.data.url);
        }
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Open the app
        clients.openWindow('/');
    }
  } else {
    // Default action - open the app or specific URL
    if (event.notification.data && event.notification.data.url) {
      clients.openWindow(event.notification.data.url);
    } else {
      clients.openWindow('/');
    }
  }
});
