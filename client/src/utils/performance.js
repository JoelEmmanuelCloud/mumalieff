export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};


export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return React.forwardRef((props, ref) => (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
};


export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    setScrollTop,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
};


export const useMemoizedSelector = (selector, deps = []) => {
  return React.useMemo(selector, deps);
};


class APICache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { 
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

export const usePerformanceMonitor = (componentName) => {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 100) { // Log slow renders
     
    }
  });

  React.useEffect(() => {
    startTime.current = performance.now();
  });
};


export const preloadImages = (imageUrls) => {
  return Promise.all(
    imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    })
  );
};

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          
        })
        .catch(registrationError => {
         
        });
    });
  }
};


export const injectCriticalCSS = (css) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};


export const preloadResource = (href, as, type = null) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

export const loadChunk = async (chunkName) => {
  try {
    const module = await import(`../chunks/${chunkName}`);
    return module.default || module;
  } catch (error) {
    throw error;
  }
};


export const monitorMemoryUsage = () => {
  if ('performance' in window && 'memory' in performance) {
    const memInfo = performance.memory;
    
  }
};


export const optimizedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      cacheTime: 10 * 60 * 1000, 
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: false,
    },
  },
});


export const initWebVitals = () => {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};

export const useOptimizedSearch = (searchFunction, delay = 300) => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const debouncedSearch = React.useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const cacheKey = `search_${searchQuery}`;
        const cachedResults = apiCache.get(cacheKey);
        
        if (cachedResults) {
          setResults(cachedResults);
          setIsLoading(false);
          return;
        }

        const searchResults = await searchFunction(searchQuery);
        apiCache.set(cacheKey, searchResults);
        setResults(searchResults);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay),
    [searchFunction, delay]
  );

  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error
  };
};


export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.memo(React.forwardRef((props, ref) => {
    usePerformanceMonitor(componentName);
    return <WrappedComponent {...props} ref={ref} />;
  }));
};