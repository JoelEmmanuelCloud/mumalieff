// src/components/common/PerformanceMonitor.js
import { useEffect } from 'react';

const PerformanceMonitor = () => {
  useEffect(() => {
    // Only monitor performance in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Check if gtag is available
    const hasGtag = typeof window !== 'undefined' && window.gtag;

    // Monitor Core Web Vitals
    const monitorWebVitals = async () => {
      try {
        const { getCLS, getFID, getLCP, getFCP, getTTFB } = await import('web-vitals');
        
        getCLS((metric) => {
          if (hasGtag) {
            window.gtag('event', 'web_vitals', {
              name: 'CLS',
              value: Math.round(metric.value * 1000),
              event_category: 'Performance',
              custom_parameter_1: metric.id
            });
          }
        });

        getFID((metric) => {
          if (hasGtag) {
            window.gtag('event', 'web_vitals', {
              name: 'FID',
              value: Math.round(metric.value),
              event_category: 'Performance',
              custom_parameter_1: metric.id
            });
          }
        });

        getLCP((metric) => {
          if (hasGtag) {
            window.gtag('event', 'web_vitals', {
              name: 'LCP',
              value: Math.round(metric.value),
              event_category: 'Performance',
              custom_parameter_1: metric.id
            });
          }
        });

        getFCP((metric) => {
          if (hasGtag) {
            window.gtag('event', 'web_vitals', {
              name: 'FCP',
              value: Math.round(metric.value),
              event_category: 'Performance',
              custom_parameter_1: metric.id
            });
          }
        });

        getTTFB((metric) => {
          if (hasGtag) {
            window.gtag('event', 'web_vitals', {
              name: 'TTFB',
              value: Math.round(metric.value),
              event_category: 'Performance',
              custom_parameter_1: metric.id
            });
          }
        });
      } catch (error) {
        console.warn('Web Vitals monitoring failed:', error);
      }
    };

    // Monitor page load performance
    const monitorPageLoad = () => {
      if ('performance' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const loadTime = entry.loadEventEnd - entry.fetchStart;
              const domContentLoaded = entry.domContentLoadedEventEnd - entry.fetchStart;
              
              if (hasGtag) {
                window.gtag('event', 'page_load_time', {
                  value: Math.round(loadTime),
                  event_category: 'Performance',
                  custom_parameter_1: 'total_load_time'
                });
                
                window.gtag('event', 'dom_content_loaded', {
                  value: Math.round(domContentLoaded),
                  event_category: 'Performance',
                  custom_parameter_1: 'dom_ready_time'
                });
              }
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['navigation'] });
        } catch (error) {
          console.warn('Performance observer failed:', error);
        }
        
        return () => {
          try {
            observer.disconnect();
          } catch (error) {
            // Observer may already be disconnected
          }
        };
      }
    };

    // Monitor resource loading performance
    const monitorResources = () => {
      if ('performance' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              // Monitor slow resources (> 1 second)
              if (entry.duration > 1000) {
                if (hasGtag) {
                  window.gtag('event', 'slow_resource', {
                    value: Math.round(entry.duration),
                    event_category: 'Performance',
                    custom_parameter_1: entry.name.split('/').pop() || 'unknown'
                  });
                }
              }
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
          console.warn('Resource observer failed:', error);
        }
        
        return () => {
          try {
            observer.disconnect();
          } catch (error) {
            // Observer may already be disconnected
          }
        };
      }
    };

    // Monitor JavaScript errors
    const monitorErrors = () => {
      const handleError = (event) => {
        if (hasGtag) {
          window.gtag('event', 'javascript_error', {
            event_category: 'Error',
            event_label: event.error?.message || 'Unknown error',
            custom_parameter_1: event.filename || 'unknown_file',
            custom_parameter_2: event.lineno || 0
          });
        }
      };

      const handleUnhandledRejection = (event) => {
        if (hasGtag) {
          window.gtag('event', 'unhandled_promise_rejection', {
            event_category: 'Error',
            event_label: event.reason?.message || 'Promise rejection',
            custom_parameter_1: 'promise_rejection'
          });
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    };

    // Monitor network status
    const monitorNetwork = () => {
      const handleOnline = () => {
        if (hasGtag) {
          window.gtag('event', 'network_status', {
            event_category: 'Network',
            event_label: 'online'
          });
        }
      };

      const handleOffline = () => {
        if (hasGtag) {
          window.gtag('event', 'network_status', {
            event_category: 'Network',
            event_label: 'offline'
          });
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    };

    // Initialize all monitoring
    const cleanup = [];
    
    monitorWebVitals();
    cleanup.push(monitorPageLoad());
    cleanup.push(monitorResources());
    cleanup.push(monitorErrors());
    cleanup.push(monitorNetwork());

    // Report initial performance metrics
    setTimeout(() => {
      if ('performance' in window && hasGtag) {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          const metrics = {
            dns_lookup: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp_connect: perfData.connectEnd - perfData.connectStart,
            ssl_negotiation: perfData.secureConnectionStart > 0 ? 
              perfData.connectEnd - perfData.secureConnectionStart : 0,
            server_response: perfData.responseStart - perfData.requestStart,
            dom_processing: perfData.domComplete - perfData.domLoading
          };

          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              window.gtag('event', 'performance_timing', {
                value: Math.round(value),
                event_category: 'Performance',
                custom_parameter_1: name
              });
            }
          });
        }
      }
    }, 2000);

    // Cleanup function
    return () => {
      cleanup.forEach(cleanupFn => {
        if (typeof cleanupFn === 'function') {
          try {
            cleanupFn();
          } catch (error) {
            console.warn('Cleanup error:', error);
          }
        }
      });
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default PerformanceMonitor;