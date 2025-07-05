// src/utils/analytics.js
/**
 * Analytics utility functions for safe gtag usage
 */

// Check if gtag is available
export const isAnalyticsAvailable = () => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         process.env.REACT_APP_ENABLE_ANALYTICS === 'true' &&
         process.env.NODE_ENV === 'production';
};

// Safe gtag wrapper
export const trackEvent = (action, parameters = {}) => {
  if (isAnalyticsAvailable()) {
    try {
      window.gtag('event', action, {
        ...parameters,
        send_to: process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  } else {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', action, parameters);
    }
  }
};

// Track page views
export const trackPageView = (page_title, page_location) => {
  if (isAnalyticsAvailable()) {
    try {
      window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
        page_title,
        page_location,
        send_page_view: true
      });
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  } else {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Page View:', page_title, page_location);
    }
  }
};

// Track exceptions/errors
export const trackException = (description, fatal = false) => {
  trackEvent('exception', {
    description: description || 'Unknown error',
    fatal,
    event_category: 'Error'
  });
};

// Track performance metrics
export const trackPerformance = (name, value, category = 'Performance') => {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('Invalid performance value:', value);
    return;
  }

  trackEvent('timing_complete', {
    name,
    value: Math.round(value),
    event_category: category
  });
};

// Track user interactions
export const trackUserInteraction = (action, category = 'User Interaction', label = '') => {
  trackEvent(action, {
    event_category: category,
    event_label: label
  });
};

// Track e-commerce events
export const trackPurchase = (transaction_id, value, currency = 'NGN', items = []) => {
  trackEvent('purchase', {
    transaction_id,
    value: parseFloat(value) || 0,
    currency,
    items: Array.isArray(items) ? items : []
  });
};

export const trackAddToCart = (currency = 'NGN', value, items = []) => {
  trackEvent('add_to_cart', {
    currency,
    value: parseFloat(value) || 0,
    items: Array.isArray(items) ? items : []
  });
};

export const trackViewItem = (currency = 'NGN', value, items = []) => {
  trackEvent('view_item', {
    currency,
    value: parseFloat(value) || 0,
    items: Array.isArray(items) ? items : []
  });
};

export const trackBeginCheckout = (currency = 'NGN', value, items = []) => {
  trackEvent('begin_checkout', {
    currency,
    value: parseFloat(value) || 0,
    items: Array.isArray(items) ? items : []
  });
};

// PWA events
export const trackPWAInstall = () => {
  trackEvent('pwa_install_prompt', {
    event_category: 'PWA'
  });
};

export const trackPWAInstalled = () => {
  trackEvent('pwa_installed', {
    event_category: 'PWA'
  });
};

// Network events
export const trackNetworkStatus = (status) => {
  trackEvent('network_status', {
    event_category: 'Network',
    event_label: status
  });
};

// Custom events for Mumalieff
export const trackCustomDesign = (design_type) => {
  trackEvent('custom_design_created', {
    event_category: 'Custom Design',
    event_label: design_type
  });
};

export const trackWishlistAdd = (product_id) => {
  trackEvent('add_to_wishlist', {
    event_category: 'Wishlist',
    event_label: product_id
  });
};

export const trackWishlistRemove = (product_id) => {
  trackEvent('remove_from_wishlist', {
    event_category: 'Wishlist',
    event_label: product_id
  });
};

export const trackSearchQuery = (search_term, results_count = 0) => {
  trackEvent('search', {
    search_term,
    event_category: 'Search',
    custom_parameter_1: parseInt(results_count) || 0
  });
};

export const trackProductShare = (product_id, method) => {
  trackEvent('share', {
    method,
    content_type: 'product',
    item_id: product_id,
    event_category: 'Social'
  });
};

export const trackNewsletterSignup = (source = 'unknown') => {
  trackEvent('sign_up', {
    method: 'email',
    event_category: 'Newsletter',
    event_label: source
  });
};

// Initialize analytics
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && 
      process.env.REACT_APP_ENABLE_ANALYTICS === 'true' && 
      process.env.REACT_APP_GA_MEASUREMENT_ID) {
    
    // Check if gtag script is already loaded
    if (!window.gtag) {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
        send_page_view: false // We'll manually track page views
      });
    }
  }
};

// Error boundary tracking
export const trackErrorBoundary = (error, errorInfo) => {
  trackException(`ErrorBoundary: ${error.message}`, true);
  
  // Additional error details
  trackEvent('error_boundary', {
    event_category: 'Error',
    error_message: error.message,
    error_stack: error.stack,
    component_stack: errorInfo?.componentStack
  });
};

// FIXED: Proper default export - assign to variable first
const analyticsUtils = {
  isAnalyticsAvailable,
  trackEvent,
  trackPageView,
  trackException,
  trackPerformance,
  trackUserInteraction,
  trackPurchase,
  trackAddToCart,
  trackViewItem,
  trackBeginCheckout,
  trackPWAInstall,
  trackPWAInstalled,
  trackNetworkStatus,
  trackCustomDesign,
  trackWishlistAdd,
  trackWishlistRemove,
  trackSearchQuery,
  trackProductShare,
  trackNewsletterSignup,
  initializeAnalytics,
  trackErrorBoundary
};

export default analyticsUtils;