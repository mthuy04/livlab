import { LIVLAB_TENANT, TENANTS, type TenantStorefrontConfig } from './tenantConfig';

/**
 * Which storefront a hostname belongs to, and what search engines may do with it.
 *
 * Pure on purpose: no request objects, no cookies. `resolveTenant.ts` feeds it
 * the request's host and preview choice, and the tests feed it strings.
 *
 * The hostname only ever SELECTS among configured public storefronts. It is
 * never an authority for data access — the showroom portal and every API that
 * touches leads or quotes resolves the caller's showroom from the signed
 * session — so an unknown or forged Host header can do no more than land on
 * LivLab's own storefront, unindexed.
 */

/** Lower case, no port, no trailing dot. Anything that is not a plain hostname is rejected. */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const host = raw.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(host) && host.length <= 253 ? host : null;
}

interface HostEntry {
  tenant: TenantStorefrontConfig;
  /** False for a tenant's preview hosts: served, never indexed. */
  indexable: boolean;
}

/** Built from the tenant configs themselves, so a host is declared in exactly one place. */
const HOST_INDEX: ReadonlyMap<string, HostEntry> = (() => {
  const index = new Map<string, HostEntry>();
  const claim = (tenant: TenantStorefrontConfig, host: string, indexable: boolean) => {
    const key = normalizeHost(host);
    if (!key) throw new Error(`Tenant ${tenant.id} declares an invalid host: ${host}`);
    const taken = index.get(key);
    if (taken) throw new Error(`Host ${key} is claimed by both ${taken.tenant.id} and ${tenant.id}`);
    index.set(key, { tenant, indexable });
  };
  for (const tenant of Object.values(TENANTS)) {
    for (const host of tenant.site?.hosts ?? []) claim(tenant, host, true);
    for (const host of tenant.site?.previewHosts ?? []) claim(tenant, host, false);
  }
  return index;
})();

export function tenantForHost(host: string | null): TenantStorefrontConfig | null {
  return host ? HOST_INDEX.get(host)?.tenant ?? null : null;
}

export type TenantResolution =
  /** The request arrived on a hostname a tenant declares as its own. */
  | 'HOST'
  /** A preview choice (`/s/<slug>`) on one of LivLab's hosts. */
  | 'PREVIEW'
  /** Nothing matched: LivLab's storefront on an undeclared host (vercel.app, localhost). */
  | 'DEFAULT';

export interface SiteContext {
  tenant: TenantStorefrontConfig;
  via: TenantResolution;
  host: string | null;
  /** The origin every canonical, sitemap and structured-data URL is built on. */
  origin: string;
  /**
   * Whether this response may be indexed at all. Only a tenant on its own
   * declared host qualifies: a preview, a vercel.app alias or an unknown host
   * would otherwise compete with the real site as a duplicate.
   */
  indexable: boolean;
}

const LIVLAB_ORIGIN = LIVLAB_TENANT.site?.origin ?? 'https://www.livlab.space';

export function siteContext({
  host,
  previewTenant,
}: {
  host: string | null;
  previewTenant: TenantStorefrontConfig | null;
}): SiteContext {
  const entry = host ? HOST_INDEX.get(host) ?? null : null;
  const owner = entry?.tenant ?? null;

  // A showroom's own hostname always serves that showroom. A preview cookie
  // set elsewhere cannot repaint giangson.livlab.space as another tenant.
  // A preview host serves it too, unindexed, with the canonical on the origin.
  if (entry && owner && owner.id !== LIVLAB_TENANT.id) {
    return { tenant: owner, via: 'HOST', host, origin: owner.site!.origin, indexable: entry.indexable };
  }

  // A preview cookie paints LivLab's hosts only with a demo that has no
  // address of its own. A showroom with its own domain is served there and
  // nowhere else, so livlab.space never shows its products, logo or contacts
  // — even to a browser still holding a cookie from before it had a domain.
  if (previewTenant && previewTenant.id !== LIVLAB_TENANT.id && !previewTenant.site) {
    return {
      tenant: previewTenant,
      via: 'PREVIEW',
      host,
      // A demo without a domain of its own: canonicals stay on LivLab.
      origin: LIVLAB_ORIGIN,
      indexable: false,
    };
  }

  return {
    tenant: LIVLAB_TENANT,
    via: owner ? 'HOST' : 'DEFAULT',
    host,
    origin: LIVLAB_ORIGIN,
    indexable: entry?.indexable ?? false,
  };
}

/** An absolute URL on the context's canonical origin. `path` must start with '/'. */
export function absoluteUrl(origin: string, path: string): string {
  return new URL(path, `${origin}/`).toString();
}
