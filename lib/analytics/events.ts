/**
 * Storefront measurement: one place that names every event and decides where
 * it goes.
 *
 * Events use GA4's recommended names where one exists (view_item,
 * view_item_list, select_item, generate_lead) and plain snake_case otherwise.
 * They go to `gtag` when the tenant has a GA4 property configured and to
 * `window.dataLayer` either way, so a Tag Manager container can pick them up
 * without code changes.
 *
 * Nothing personal is ever sent: no name, phone, email or free text — only
 * product identifiers, counts, values in VND, page paths and the visit's
 * traffic channel.
 */

export type AnalyticsEventName =
  | 'view_item'
  | 'view_item_list'
  | 'select_item'
  | 'generate_lead'
  | 'contact_click'
  | 'phone_click'
  | 'zalo_click'
  | 'quote_request_submit'
  | 'room_studio_open'
  | 'room_studio_quote_request';

export interface AnalyticsItem {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined | AnalyticsItem[]>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let tenantId: string | null = null;

/** Set once by the tracker so every event carries the storefront it came from. */
export function setAnalyticsTenant(id: string) {
  tenantId = id;
}

export function trackEvent(name: AnalyticsEventName, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return;
  const payload: AnalyticsParams = { ...params, tenant_id: tenantId ?? undefined };
  for (const key of Object.keys(payload)) if (payload[key] === undefined || payload[key] === null) delete payload[key];

  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  else window.dataLayer.push({ event: name, ...payload });

  try {
    if (localStorage.getItem('livlab_debug_analytics') === '1') console.debug('[analytics]', name, payload);
  } catch {
    // Storage unavailable: no debug output, nothing else changes.
  }
}

/* ------------------------------------------------------------ attribution */

export type TrafficChannel = 'organic_search' | 'paid' | 'social' | 'referral' | 'direct';

export interface VisitAttribution {
  channel: TrafficChannel;
  /** Path the visit started on, without query string. */
  landingPath: string;
  /** Hostname of the referring page, never its path. */
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

const ATTRIBUTION_KEY = 'livlab_visit_attribution';
const SEARCH_ENGINES = /(^|\.)(google|bing|coccoc|yahoo|duckduckgo|yandex|baidu)\./;
const SOCIAL = /(^|\.)(facebook|fb|messenger|instagram|zalo|tiktok|youtube|linkedin|threads)\./;

export function channelFor(referrerHost: string | null, utmMedium: string | null, ownHost: string): TrafficChannel {
  const medium = (utmMedium ?? '').toLowerCase();
  if (/^(cpc|ppc|paid|paidsearch|paid_social|display)$/.test(medium)) return 'paid';
  if (medium === 'social') return 'social';
  if (!referrerHost || referrerHost === ownHost) return medium ? 'referral' : 'direct';
  if (SEARCH_ENGINES.test(`.${referrerHost}`)) return 'organic_search';
  if (SOCIAL.test(`.${referrerHost}`) || referrerHost === 'l.facebook.com' || referrerHost === 'lm.facebook.com') {
    return 'social';
  }
  return 'referral';
}

/** First touch of this browser session; later pages keep the landing they came in on. */
export function recordVisitAttribution() {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(ATTRIBUTION_KEY)) return;
    const url = new URL(window.location.href);
    let referrerHost: string | null = null;
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : null;
    } catch {
      referrerHost = null;
    }
    const utmMedium = url.searchParams.get('utm_medium');
    const attribution: VisitAttribution = {
      channel: channelFor(referrerHost, utmMedium, url.hostname),
      landingPath: url.pathname,
      referrerHost,
      utmSource: url.searchParams.get('utm_source'),
      utmMedium,
      utmCampaign: url.searchParams.get('utm_campaign'),
    };
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Storage blocked: the visit is simply unattributed.
  }
}

export function visitAttribution(): VisitAttribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as VisitAttribution) : null;
  } catch {
    return null;
  }
}
