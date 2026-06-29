declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function initAnalytics() {
  // handled globally in index.html
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  if (!window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
