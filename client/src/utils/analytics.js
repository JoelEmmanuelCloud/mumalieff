// src/utils/analytics.js
/**
 * Analytics utility functions for safe gtag usage
 */

// Check if gtag is available
export const isAnalyticsAvailable = () => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         process.env.NODE_ENV === 'production';
};

// Safe gtag wrapper
export const trackEvent = (action, parameters = {}) => {
  if (isAnalyticsAvailable()) {
    try {
      window.gtag('event', action, parameters);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
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
      });
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  }
};

// Track exceptions/errors
export const trackException = (description, fatal = false) => {
  trackEvent('exception', {
    description,
    fatal,
    event_category: 'Error'
  });
};

// Track performance metrics
export const trackPerformance = (name, value, category = 'Performance') => {
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
    value,
    currency,
    items
  });
};

export const trackAddToCart = (currency = 'NGN', value, items = []) => {
  trackEvent('add_to_cart', {
    currency,
    value,
    items
  });
};

export const trackViewItem = (currency = 'NGN', value, items = []) => {
  trackEvent('view_item', {
    currency,
    value,
    items
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

export const trackSearchQuery = (search_term, results_count = 0) => {
  trackEvent('search', {
    search_term,
    event_category: 'Search',
    custom_parameter_1: results_count
  });
};

export default {
  isAnalyticsAvailable,
  trackEvent,
  trackPageView,
  trackException,
  trackPerformance,
  trackUserInteraction,
  trackPurchase,
  trackAddToCart,
  trackViewItem,
  trackPWAInstall,
  trackPWAInstalled,
  trackNetworkStatus,
  trackCustomDesign,
  trackWishlistAdd,
  trackSearchQuery
};