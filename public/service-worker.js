/**
 * Service Worker for PWA
 * PROMPT 7: Mobile-First Assessment Experience
 * 
 * Provides offline capability and auto-sync when connection restored
 */

const CACHE_NAME = 'torsor-assessment-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http(s)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline indicator for failed API calls
            return new Response(
              JSON.stringify({ offline: true, error: 'Network unavailable' }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, update cache in background
        fetch(request)
          .then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          })
          .catch(() => {
            // Silently fail background update
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background Sync - Sync pending assessment data when online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncPendingAssessments());
  }
});

// Push Notifications - Handle reminder notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Assessment Reminder';
  const options = {
    body: data.body || 'Don\'t forget to complete your skills assessment!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/accountancy/team-portal/assessment'
    },
    actions: [
      {
        action: 'open',
        title: 'Start Assessment'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click - Handle notification actions
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Message event - Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ASSESSMENT_DATA') {
    // Cache assessment data for offline use
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(
        new Request('/api/assessment-data'),
        new Response(JSON.stringify(event.data.payload), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  }
});

// Helper function to sync pending assessments
async function syncPendingAssessments() {
  try {
    // Get pending data from IndexedDB (implementation depends on your setup)
    const pendingData = await getPendingAssessments();
    
    if (!pendingData || pendingData.length === 0) {
      console.log('[Service Worker] No pending assessments to sync');
      return;
    }
    
    console.log(`[Service Worker] Syncing ${pendingData.length} pending assessments`);
    
    // Send each pending assessment
    for (const assessment of pendingData) {
      try {
        const response = await fetch('/api/assessments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessment)
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingAssessment(assessment.id);
          console.log('[Service Worker] Synced assessment:', assessment.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync assessment:', error);
      }
    }
    
    // Notify clients of successful sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: pendingData.length
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error; // Will retry sync later
  }
}

// Helper functions for IndexedDB operations
async function getPendingAssessments() {
  // Placeholder - implement with IndexedDB
  return [];
}

async function removePendingAssessment(id) {
  // Placeholder - implement with IndexedDB
  console.log('Removing pending assessment:', id);
}

console.log('[Service Worker] Loaded and ready');

