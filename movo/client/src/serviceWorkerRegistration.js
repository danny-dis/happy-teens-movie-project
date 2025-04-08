/**
 * Service Worker Registration
 * Handles registration and updates of the service worker
 * 
 * @author zophlic
 */

// Check if service workers are supported
const isServiceWorkerSupported = 'serviceWorker' in navigator;

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration|null>} Service worker registration or null if not supported
 */
export function register() {
  if (!isServiceWorkerSupported) {
    console.log('Service workers are not supported in this browser');
    return Promise.resolve(null);
  }
  
  // Only register in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.REACT_APP_ENABLE_SERVICE_WORKER) {
    console.log('Service worker registration skipped in development mode');
    return Promise.resolve(null);
  }
  
  const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
  return navigator.serviceWorker.register(swUrl)
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        
        if (!installingWorker) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('New content is available, please refresh');
              
              // Dispatch event for the app to show update notification
              window.dispatchEvent(new CustomEvent('serviceWorkerUpdated'));
            } else {
              // Content is cached for offline use
              console.log('Content is cached for offline use');
              
              // Dispatch event for the app to show offline ready notification
              window.dispatchEvent(new CustomEvent('serviceWorkerInstalled'));
            }
          }
        };
      };
      
      return registration;
    })
    .catch(error => {
      console.error('Error during service worker registration:', error);
      return null;
    });
}

/**
 * Unregister the service worker
 * @returns {Promise<boolean>} Whether unregistration was successful
 */
export function unregister() {
  if (!isServiceWorkerSupported) {
    return Promise.resolve(false);
  }
  
  return navigator.serviceWorker.ready
    .then(registration => {
      return registration.unregister();
    })
    .then(success => {
      console.log('Service Worker unregistered:', success);
      return success;
    })
    .catch(error => {
      console.error('Error unregistering service worker:', error);
      return false;
    });
}

/**
 * Update the service worker
 * @returns {Promise<boolean>} Whether update was successful
 */
export function update() {
  if (!isServiceWorkerSupported) {
    return Promise.resolve(false);
  }
  
  return navigator.serviceWorker.ready
    .then(registration => {
      return registration.update();
    })
    .then(() => {
      console.log('Service Worker update requested');
      return true;
    })
    .catch(error => {
      console.error('Error updating service worker:', error);
      return false;
    });
}

/**
 * Check if the app is installed (PWA)
 * @returns {boolean} Whether the app is installed
 */
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Check if the app can be installed (PWA)
 * @param {Function} callback - Callback to be called when installation is available
 * @returns {Function} Function to remove the event listener
 */
export function onInstallAvailable(callback) {
  const handler = (event) => {
    event.preventDefault();
    callback(event);
  };
  
  window.addEventListener('beforeinstallprompt', handler);
  
  return () => {
    window.removeEventListener('beforeinstallprompt', handler);
  };
}

/**
 * Subscribe to push notifications
 * @param {Object} options - Subscription options
 * @returns {Promise<PushSubscription|null>} Push subscription or null if not supported
 */
export function subscribeToPushNotifications(options = {}) {
  if (!isServiceWorkerSupported || !('PushManager' in window)) {
    console.log('Push notifications are not supported in this browser');
    return Promise.resolve(null);
  }
  
  const defaultOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
    )
  };
  
  const subscribeOptions = { ...defaultOptions, ...options };
  
  return navigator.serviceWorker.ready
    .then(registration => {
      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(subscription => {
      console.log('Push notification subscription successful:', subscription);
      return subscription;
    })
    .catch(error => {
      console.error('Error subscribing to push notifications:', error);
      return null;
    });
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} Whether unsubscription was successful
 */
export function unsubscribeFromPushNotifications() {
  if (!isServiceWorkerSupported || !('PushManager' in window)) {
    return Promise.resolve(false);
  }
  
  return navigator.serviceWorker.ready
    .then(registration => {
      return registration.pushManager.getSubscription();
    })
    .then(subscription => {
      if (!subscription) {
        return false;
      }
      
      return subscription.unsubscribe();
    })
    .then(success => {
      console.log('Push notification unsubscription successful:', success);
      return success;
    })
    .catch(error => {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    });
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array} Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
