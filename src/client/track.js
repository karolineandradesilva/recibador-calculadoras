// Thin analytics wrapper. Sends events only when GA4 is loaded and the
// visitor granted consent; otherwise it is a no-op.
export function track(name, params = {}) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch {
    // Analytics must never break the page.
  }
}
