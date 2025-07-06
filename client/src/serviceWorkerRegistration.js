const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

const SW_CONFIG = {
  updateCheckInterval: 60000,
  skipWaitingOnUpdate: true,
  enableBackgroundSync: true,
  enablePushNotifications: false,
  cacheFirst: true
};

let updateAvailable = false;
let registration = null;

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        
        navigator.serviceWorker.ready.then(() => {
          if (config?.onReady) {
            config.onReady();
          }
        });
      } else {
        registerValidSW(swUrl, config);
      }
      
      if (SW_CONFIG.updateCheckInterval) {
        setInterval(() => {
          checkForUpdates();
        }, SW_CONFIG.updateCheckInterval);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((reg) => {
      registration = reg;
      
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              updateAvailable = true;
              
              if (config?.onUpdate) {
                config.onUpdate(reg);
              } else {
                showUpdateNotification();
              }
              
              if (SW_CONFIG.skipWaitingOnUpdate) {
                setTimeout(() => {
                  activateUpdate();
                }, 5000);
              }
            } else {
              if (config?.onSuccess) {
                config.onSuccess(reg);
              }
            }
          }
        });
      });
      
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      
      if (SW_CONFIG.enableBackgroundSync && 'sync' in window.ServiceWorkerRegistration.prototype) {
        setupBackgroundSync(reg);
      }
      
      if (SW_CONFIG.enablePushNotifications) {
        requestNotificationPermission();
      }
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

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
    });
}

function handleSWMessage(event) {
  const { data } = event;
  
  switch (data?.type) {
    case 'CACHE_UPDATED':
      break;
    case 'OFFLINE_READY':
      break;
    case 'ERROR':
      console.error('❌ Service Worker error:', data.error);
      break;
  }
}

export function checkForUpdates() {
  if (registration) {
    registration.update()
      .then(() => {
      })
      .catch((error) => {
        console.error('Failed to check for updates:', error);
      });
  }
}

export function activateUpdate() {
  if (updateAvailable && registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

function showUpdateNotification() {
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
  
  setTimeout(() => {
    const existingBanner = document.getElementById('sw-update-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
  }, 10000);
}

function setupBackgroundSync(registration) {
  window.addEventListener('online', () => {
    registration.sync.register('background-sync').catch(console.error);
  });
}

function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then((permission) => {
    });
  }
}

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

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.unregister();
      })
      .catch((error) => {
        console.error('Failed to unregister Service Worker:', error.message);
      });
  }
}

export function isRunningFromCache() {
  return navigator.serviceWorker?.controller !== null;
}

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

if (typeof window !== 'undefined') {
  window.activateServiceWorkerUpdate = activateUpdate;
  window.checkServiceWorkerUpdates = checkForUpdates;
  window.getServiceWorkerCacheInfo = getCacheInfo;
  window.clearServiceWorkerCache = clearCache;
}