import { createVitalsReporter, publicPage, targetCategory } from './web-vitals-report';
import type { VitalsContext } from './web-vitals-report';

let started = false;
export function startWebVitals() {
  if (started || '__AVALON_PRERENDER__' in window || APP_VERSION === 'DEV') return;
  const page = publicPage(location.pathname);
  const analytics = window as Window & {
    gtag?: (command: string, name: string, payload: Record<string, string | number>) => void;
  };
  if (!page || typeof analytics.gtag !== 'function') return;
  started = true;
  let restored: VitalsContext | null = null;
  // Register before web-vitals' pageshow handlers start the new metric lifecycle.
  window.addEventListener(
    'pageshow',
    (event) => {
      if (event.persisted) restored = { page: publicPage(location.pathname), viewport: window.innerWidth };
    },
    { capture: true },
  );
  const report = createVitalsReporter({
    page,
    version: APP_VERSION,
    viewport: window.innerWidth,
    currentPath: () => location.pathname,
    restoredContext: () => restored,
    send: (name, payload) => analytics.gtag?.('event', name, payload),
  });
  // Fetch independently of application startup: diagnostics must not delay
  // hydration. Buffered observers recover paints that precede this small chunk.
  void import(/* webpackChunkName: "web-vitals" */ 'web-vitals/attribution')
    .then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
      const options = { generateTarget: targetCategory, reportSoftNavs: false };
      onLCP(report, options);
      onINP(report, options);
      onCLS(report, options);
      onFCP(report, options);
      onTTFB(report, options);
    })
    .catch(() => {
      // Offline/blocked telemetry must not prevent the application from loading.
    });
}
