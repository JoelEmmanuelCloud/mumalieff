import React, { useEffect } from 'react';
import { trackPerformance, trackException, isAnalyticsAvailable } from '../../utils/analytics';

const PerformanceMonitor = () => {
  useEffect(() => {

    if (process.env.NODE_ENV !== 'production') {
      return;
    }


    const monitorWebVitals = async () => {
      try {
        const { getCLS, getFID, getLCP, getFCP, getTTFB } = await import('web-vitals');
        
        getCLS((metric) => {
          trackPerformance('CLS', metric.value * 1000, 'Web Vitals');
        });

        getFID((metric) => {
          trackPerformance('FID', metric.value, 'Web Vitals');
        });

        getLCP((metric) => {
          trackPerformance('LCP', metric.value, 'Web Vitals');
        });

        getFCP((metric) => {
          trackPerformance('FCP', metric.value, 'Web Vitals');
        });

        getTTFB((metric) => {
          trackPerformance('TTFB', metric.value, 'Web Vitals');
        });
      } catch (error) {
        console.warn('Web Vitals monitoring failed:', error);
      }
    };


    const monitorPageLoad = () => {
      if (!('performance' in window)) return;

      try {
        const observer = new PerformanceObserver((list) => {
          try {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'navigation') {
                const loadTime = entry.loadEventEnd - entry.fetchStart;
                const domContentLoaded = entry.domContentLoadedEventEnd - entry.fetchStart;
                
                trackPerformance('page_load_time', loadTime);
                trackPerformance('dom_content_loaded', domContentLoaded);
              }
            });
          } catch (error) {
            console.warn('Performance entry processing error:', error);
          }
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        
        return () => {
          try {
            observer.disconnect();
          } catch (error) {
       
          }
        };
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
        return () => {};
      }
    };

   
    const monitorResources = () => {
      if (!('performance' in window)) return;

      try {
        const observer = new PerformanceObserver((list) => {
          try {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'resource' && entry.duration > 1000) {
           
                trackPerformance('slow_resource', entry.duration, 'Performance');
              }
            });
          } catch (error) {
            console.warn('Resource entry processing error:', error);
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
        
        return () => {
          try {
            observer.disconnect();
          } catch (error) {
  
          }
        };
      } catch (error) {
        console.warn('Resource observer setup failed:', error);
        return () => {};
      }
    };

    const monitorErrors = () => {
      const handleError = (event) => {
        try {
          trackException(
            event.error?.message || 'Unknown error',
            false 
          );
        } catch (error) {
          console.warn('Error tracking failed:', error);
        }
      };

      const handleUnhandledRejection = (event) => {
        try {
          trackException(
            event.reason?.message || 'Promise rejection',
            false
          );
        } catch (error) {
          console.warn('Promise rejection tracking failed:', error);
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    };

    const monitorNetwork = () => {
      const handleOnline = () => {
        try {
          if (isAnalyticsAvailable()) {
            trackPerformance('network_online', 1, 'Network');
          }
        } catch (error) {
          console.warn('Network online tracking failed:', error);
        }
      };

      const handleOffline = () => {
        try {
          if (isAnalyticsAvailable()) {
            trackPerformance('network_offline', 1, 'Network');
          }
        } catch (error) {
          console.warn('Network offline tracking failed:', error);
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    };

    const cleanupFunctions = [];
  
    monitorWebVitals();
    
    const pageLoadCleanup = monitorPageLoad();
    if (typeof pageLoadCleanup === 'function') {
      cleanupFunctions.push(pageLoadCleanup);
    }
    
    const resourceCleanup = monitorResources();
    if (typeof resourceCleanup === 'function') {
      cleanupFunctions.push(resourceCleanup);
    }
    
    const errorCleanup = monitorErrors();
    if (typeof errorCleanup === 'function') {
      cleanupFunctions.push(errorCleanup);
    }
    
    const networkCleanup = monitorNetwork();
    if (typeof networkCleanup === 'function') {
      cleanupFunctions.push(networkCleanup);
    }

    const timeoutId = setTimeout(() => {
      try {
        if ('performance' in window && isAnalyticsAvailable()) {
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
                trackPerformance(name, value, 'Performance Timing');
              }
            });
          }
        }
      } catch (error) {
        console.warn('Initial performance metrics failed:', error);
      }
    }, 2000);

    return () => {
   
      clearTimeout(timeoutId);
      
 
      cleanupFunctions.forEach(cleanupFn => {
        try {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      });
    };
  }, []); 


  return null;
};

export default PerformanceMonitor;