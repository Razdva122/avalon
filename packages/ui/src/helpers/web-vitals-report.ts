import type { MetricWithAttribution } from 'web-vitals/attribution';

type PublicPage = { path: string; route: string; locale: string };
export type VitalsContext = { page: PublicPage | null; viewport: number };
type Payload = Record<string, string | number>;

// Exact public paths only: never turn arbitrary slugs or private IDs into dimensions.
export function publicPage(pathname: string): PublicPage | null {
  const prefix = pathname.match(/^\/(ru|zh-tw|zh-cn|es|pt)(?=\/|$)/)?.[0] || '';
  const path = pathname.slice(prefix.length).replace(/\/$/, '') || '/';
  let route: string;
  if (path === '/') route = 'lobby';
  else if (/^\/(about|support|community|stats)$/.test(path)) route = path.slice(1);
  else if (path === '/wiki') route = 'wiki';
  else if (path === '/wiki/rules') route = 'rules';
  else if (path === '/wiki/roles') route = 'roles';
  else if (path === '/wiki/expansions') route = 'expansions';
  else if (
    /^\/wiki\/roles\/(merlin|merlin_pure|lovers|lancelots|guinevere|lunatic|brute|percival|servant|troublemaker|revealer|witch|mordred|trickster|cleric|oberon|morgana|minion)$/.test(
      path,
    )
  )
    route = 'role';
  else if (/^\/wiki\/expansions\/(lady|lady_sea|plot_cards|excalibur)$/.test(path)) route = 'expansion';
  else return null;
  return { path: prefix + (path === '/' ? '/' : path + '/'), route, locale: prefix.slice(1) || 'en' };
}

const targets = new Set(['lobby-intro', 'hero-art', 'heading', 'image', 'button', 'link', 'text', 'other']);
export function targetCategory(node: Node | null): string {
  if (!node || node.nodeType !== 1) return 'other';
  const element = node as Element;
  if (element.matches('.lobby-intro')) return 'lobby-intro';
  if (element.matches('.character-card')) return 'hero-art';
  if (/^H[1-6]$/.test(element.tagName)) return 'heading';
  if (element.tagName === 'IMG') return 'image';
  if (element.tagName === 'BUTTON') return 'button';
  if (element.tagName === 'A') return 'link';
  if (/^(P|SPAN|LI)$/.test(element.tagName)) return 'text';
  return 'other';
}

export function createVitalsReporter(options: {
  page: PublicPage;
  version: string;
  viewport: number;
  currentPath: () => string;
  restoredContext: () => VitalsContext | null;
  send: (name: string, payload: Payload) => void;
}) {
  // At most one record per metric name, also bounded during long gaming sessions.
  const previous = new Map<string, { id: string; value: number; sequence: number }>();
  return (metric: MetricWithAttribution) => {
    try {
      const current = publicPage(options.currentPath());
      const context = metric.navigationType === 'back-forward-cache' ? options.restoredContext() : options;
      if (!context?.page || !Number.isFinite(metric.value) || metric.value < 0) return;
      // LCP may finalize in an idle callback after a click has already entered a
      // room. Keep the safely captured public load; do not collect private INP/CLS.
      if (!current && (metric.name === 'INP' || metric.name === 'CLS')) return;
      const last = previous.get(metric.name);
      if (last?.id === metric.id && last.value === metric.value) return;
      const sequence = last?.id === metric.id ? last.sequence + 1 : 1;
      const payload: Payload = {
        metric_name: metric.name,
        metric_id: metric.id,
        metric_value: Math.round(metric.value * 1000) / 1000,
        metric_sequence: sequence,
        metric_rating: metric.rating,
        navigation_type: metric.navigationType,
        app_version: options.version,
        page_route: context.page.route,
        page_locale: context.page.locale,
        viewport: context.viewport <= 600 ? 'small' : context.viewport <= 1000 ? 'medium' : 'large',
        spa_changed: Number(current?.path !== context.page.path),
        // Override GA automatic fields: callbacks can run after SPA navigation.
        page_location: 'https://avalon-game.com' + context.page.path,
        page_referrer: '',
        page_title: '',
        non_interaction: 1,
      };
      const timing = (key: string, value: number) => {
        if (Number.isFinite(value) && value >= 0) payload[key] = Math.round(value);
      };
      const target = (value?: string) => (value && targets.has(value) ? value : 'other');
      if (metric.name === 'LCP') {
        const a = metric.attribution;
        payload.metric_target = target(a.target);
        timing('ttfb_ms', a.timeToFirstByte);
        timing('load_delay_ms', a.resourceLoadDelay);
        timing('load_duration_ms', a.resourceLoadDuration);
        timing('render_delay_ms', a.elementRenderDelay);
      } else if (metric.name === 'INP') {
        const a = metric.attribution;
        payload.metric_target = target(a.interactionTarget);
        timing('input_delay_ms', a.inputDelay);
        timing('processing_ms', a.processingDuration);
        timing('presentation_delay_ms', a.presentationDelay);
      } else if (metric.name === 'TTFB') {
        const a = metric.attribution;
        timing('waiting_ms', a.waitingDuration);
        timing('cache_ms', a.cacheDuration);
        timing('dns_ms', a.dnsDuration);
        timing('connection_ms', a.connectionDuration);
        timing('request_ms', a.requestDuration);
      }
      options.send('web_vital', payload);
      previous.set(metric.name, { id: metric.id, value: metric.value, sequence });
    } catch {
      // Blocked/failed analytics must never interrupt navigation or gameplay.
    }
  };
}
