// src/serviceWorkerRegistration.js - Enhanced with performance monitoring
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Configuration for different environments
const SW_CONFIG = {
  updateCheckInterval: 60000, // Check for updates every minute
  skipWaitingOnUpdate: true,
  enableBackgroundSync: true,
  enablePushNotifications: false, // Set to true when ready
  cacheFirst: true
};

let updateAvailable = false;
let registration = null;

/**
 * Register the service worker with enhanced configuration
 */
export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      console.warn('Service worker disabled: PUBLIC_URL origin mismatch');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        
        navigator.serviceWorker.ready.then(() => {
          console.log('✅ Service Worker ready - Cache-first strategy active');
          
          if (config?.onReady) {
            config.onReady();
          }
        });
      } else {
        registerValidSW(swUrl, config);
      }
      
      // Set up periodic update checks
      if (SW_CONFIG.updateCheckInterval) {
        setInterval(() => {
          checkForUpdates();
        }, SW_CONFIG.updateCheckInterval);
      }
    });
  }
}

/**
 * Register a valid service worker
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((reg) => {
      registration = reg;
      console.log('✅ Service Worker registered successfully');
      
      // Set up update detection
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New version available
              updateAvailable = true;
              console.log('🔄 New version available');
              
              if (config?.onUpdate) {
                config.onUpdate(reg);
              } else {
                showUpdateNotification();
              }
              
              // Auto-update if configured
              if (SW_CONFIG.skipWaitingOnUpdate) {
                setTimeout(() => {
                  activateUpdate();
                }, 5000); // Wait 5 seconds then update
              }
            } else {
              // First install
              console.log('✅ Content cached for offline use');
              
              if (config?.onSuccess) {
                config.onSuccess(reg);
              }
            }
          }
        });
      });
      
      // Set up message handling
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      
      // Enable background sync if supported
      if (SW_CONFIG.enableBackgroundSync && 'sync' in window.ServiceWorkerRegistration.prototype) {
        setupBackgroundSync(reg);
      }
      
      // Request notification permission if enabled
      if (SW_CONFIG.enablePushNotifications) {
        requestNotificationPermission();
      }
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

/**
 * Check if service worker file is valid
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Invalid service worker, reload page
        navigator.serviceWorker.ready.then((reg) => {
          reg.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('🔌 No internet connection - running in offline mode');
    });
}

/**
 * Handle messages from service worker
 */
function handleSWMessage(event) {
  const { data } = event;
  
  switch (data?.type) {
    case 'CACHE_UPDATED':
      console.log('📦 Cache updated:', data.cacheName);
      break;
    case 'OFFLINE_READY':
      console.log('🔌 App ready for offline use');
      break;
    case 'ERROR':
      console.error('❌ Service Worker error:', data.error);
      break;
  }
}

/**
 * Check for service worker updates
 */
export function checkForUpdates() {
  if (registration) {
    registration.update()
      .then(() => {
        console.log('🔍 Checked for Service Worker updates');
      })
      .catch((error) => {
        console.error('Failed to check for updates:', error);
      });
  }
}

/**
 * Activate pending service worker update
 */
export function activateUpdate() {
  if (updateAvailable && registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // Create a simple notification banner
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    ">
      <span>🔄 A new version is available!</span>
      <button 
        onclick="window.activateServiceWorkerUpdate()" 
        style="
          background: white;
          color: #2563eb;
          border: none;
          padding: 6px 12px;
          margin-left: 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        "
      >
        Update Now
      </button>
      <button 
        onclick="document.getElementById('sw-update-banner').remove()" 
        style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 6px 12px;
          margin-left: 8px;
          border-radius: 4px;
          cursor: pointer;
        "
      >
        Later
      </button>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    const existingBanner = document.getElementById('sw-update-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
  }, 10000);
}

/**
 * Setup background sync for offline actions
 */
function setupBackgroundSync(registration) {
  // Register background sync for cart updates, form submissions, etc.
  window.addEventListener('online', () => {
    console.log('🌐 Back online - syncing data');
    registration.sync.register('background-sync').catch(console.error);
  });
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then((permission) => {
      console.log('🔔 Notification permission:', permission);
    });
  }
}

/**
 * Get cache information
 */
export async function getCacheInfo() {
  if (!registration) return null;
  
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    registration.active?.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2]
    );
  });
}

/**
 * Clear all caches
 */
export async function clearCache() {
  if (!registration) return false;
  
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data.success);
    };
    
    registration.active?.postMessage(
      { type: 'CLEAR_CACHE' },
      [messageChannel.port2]
    );
  });
}

/**
 * Unregister service worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.unregister();
        console.log('🗑️ Service Worker unregistered');
      })
      .catch((error) => {
        console.error('Failed to unregister Service Worker:', error.message);
      });
  }
}

/**
 * Check if app is running from cache (offline)
 */
export function isRunningFromCache() {
  return navigator.serviceWorker?.controller !== null;
}

/**
 * Get service worker status
 */
export function getServiceWorkerStatus() {
  if (!('serviceWorker' in navigator)) {
    return 'not-supported';
  }
  
  if (!registration) {
    return 'not-registered';
  }
  
  if (registration.active) {
    return 'active';
  }
  
  if (registration.installing) {
    return 'installing';
  }
  
  if (registration.waiting) {
    return 'waiting';
  }
  
  return 'unknown';
}

// Export functions to global scope for HTML button handlers
if (typeof window !== 'undefined') {
  window.activateServiceWorkerUpdate = activateUpdate;
  window.checkServiceWorkerUpdates = checkForUpdates;
  window.getServiceWorkerCacheInfo = getCacheInfo;
  window.clearServiceWorkerCache = clearCache;
}

