export const trackEvent = (action, category, label, value) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  } else {
    console.warn('gtag is not defined');
  }
};
