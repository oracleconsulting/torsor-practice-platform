/**
 * Service Worker Registration for PWA
 * 
 * Registers the service worker for offline functionality,
 * caching, and push notifications
 */

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[PWA] New version available! Please refresh the page.');
              
              // Optionally show a notification to the user
              if (Notification.permission === 'granted') {
                new Notification('Update Available', {
                  body: 'A new version of the app is available. Please refresh the page.',
                  icon: '/icons/icon-192x192.png'
                });
              }
            }
          });
        }
      });

      // Check if there's an update available on page load
      registration.update();

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('[PWA] Service Worker not supported in this browser');
    return null;
  }
};

/**
 * Unregister service worker (for testing/debugging)
 */
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
    }
  }
};

/**
 * Check if app is running as PWA (standalone mode)
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  }
  return 'denied';
};
