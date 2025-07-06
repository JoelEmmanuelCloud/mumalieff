import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './styles/index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import { 
  trackException, 
  trackPerformance, 
  trackPWAInstall, 
  trackPWAInstalled,
  trackNetworkStatus,
  isAnalyticsAvailable 
} from './utils/analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    trackException(error?.message || 'App error', true);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. Please refresh the page to continue shopping.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const swConfig = {
  onSuccess: () => {
    if (isAnalyticsAvailable()) {
      trackPerformance('pwa_ready', 1, 'PWA');
    }
  },
  
  onUpdate: (registration) => {
    setTimeout(() => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }, 5000);
    
    trackPerformance('app_update', 1, 'PWA');
  }
};

const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS((metric) => {
        trackPerformance('CLS', metric.value * 1000, 'Web Vitals');
      });

      getFID((metric) => {
        trackPerformance('FID', metric.value, 'Web Vitals');
      });

      getLCP((metric) => {
        trackPerformance('LCP', metric.value, 'Web Vitals');
      });
    }).catch(() => {
    });
  }
};

initPerformanceMonitoring();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <HelmetProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </AuthProvider>
            </ThemeProvider>
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

const enablePWA = process.env.REACT_APP_ENABLE_PWA !== 'false';

if (enablePWA) {
  serviceWorkerRegistration.register(swConfig);
} else {
  serviceWorkerRegistration.unregister();
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  trackPWAInstall();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  trackPWAInstalled();
});

window.installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
};

if (process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;
      trackPerformance('page_load_time', loadTime);
    }
  });
}

window.addEventListener('online', () => {
  trackNetworkStatus('online');
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'NETWORK_ONLINE' });
  }
});

window.addEventListener('offline', () => {
  trackNetworkStatus('offline');
});

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  document.addEventListener('touchstart', () => {}, { passive: true });
}