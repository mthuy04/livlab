'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useTenant } from '@/components/storefront/TenantContext';
import { recordVisitAttribution, setAnalyticsTenant, trackEvent } from '@/lib/analytics/events';

/**
 * Site-wide measurement for the storefront.
 *
 * - Loads GA4 only when the tenant has a measurement id; with none, events
 *   still reach `window.dataLayer` and nothing third-party is loaded.
 * - Records where the visit came from, for the lead it may become.
 * - Classifies contact clicks by their destination, once, here — so a phone
 *   link added anywhere later is measured without anyone remembering to.
 *
 * Portal routes (/showroom, /admin) are staff screens and are not measured.
 */
export default function AnalyticsTracker() {
  const tenant = useTenant();
  const measurementId = tenant.analytics?.ga4MeasurementId ?? null;

  useEffect(() => {
    setAnalyticsTenant(tenant.id);
    if (isStaffPath(window.location.pathname)) return;
    recordVisitAttribution();

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || isStaffPath(window.location.pathname)) return;
      const href = anchor.getAttribute('href') ?? '';
      const from = window.location.pathname;

      if (href.startsWith('tel:')) {
        trackEvent('phone_click', { link_location: from });
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.hostname === 'zalo.me' || url.hostname.endsWith('.zalo.me')) {
        trackEvent('zalo_click', { link_location: from });
      } else if (url.origin === window.location.origin && (url.pathname === '/contact' || url.pathname === '/quote')) {
        trackEvent('contact_click', { link_location: from, link_target: url.pathname });
      } else if (url.origin === window.location.origin && url.pathname.startsWith('/products/')) {
        trackEvent('select_item', {
          link_location: from,
          items: [{ item_id: decodeURIComponent(url.pathname.slice('/products/'.length)) }],
        });
      } else if (/(^|\.)(facebook\.com|m\.me|messenger\.com)$/.test(url.hostname)) {
        trackEvent('contact_click', { link_location: from, link_target: 'facebook' });
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [tenant.id]);

  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
    </>
  );
}

function isStaffPath(path: string) {
  return path.startsWith('/showroom') || path.startsWith('/admin');
}

/** Fires one event when it mounts. For server pages that need a client-side signal. */
export function TrackOnMount({
  name,
  params,
}: {
  name: Parameters<typeof trackEvent>[0];
  params?: Parameters<typeof trackEvent>[1];
}) {
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    trackEvent(name, JSON.parse(key));
  }, [name, key]);
  return null;
}
