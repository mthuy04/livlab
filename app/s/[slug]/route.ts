import { NextResponse } from 'next/server';
import { LIVLAB_TENANT, TENANTS } from '@/lib/storefront/tenantConfig';
import { TENANT_PREVIEW_COOKIE } from '@/lib/storefront/resolveTenant';

/**
 * The shareable entrance to a demo storefront.
 *
 *   /s/tungdang              open it
 *   /s/tungdang?next=/concepts   open it on a particular page
 *
 * Tenant resolution reads a cookie rather than the path, because a root layout
 * never receives `searchParams` and a rewrite would strip the prefix off every
 * link the page then renders. So this records the choice and redirects, and
 * from there every ordinary route — /products, /concepts, /room-studio —
 * renders as that storefront.
 *
 * Unlike `/dev/tenant` this works in production, and that is the whole point:
 * a demo nobody outside the office can open is not a demo. It is therefore
 * limited to tenants carrying `publicDemo`, which means a fixture catalogue
 * and no live showroom's commercial data behind it. Asking for any other
 * tenant 404s here exactly as an unknown one does, so the response cannot be
 * used to learn which private storefronts exist.
 */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const url = new URL(request.url);
  const requested = url.searchParams.get('next') ?? '/';

  // Same-origin paths only: an absolute URL here would be an open redirect,
  // and `//host` is absolute to a browser however much it looks like a path.
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';
  const response = NextResponse.redirect(new URL(next, url.origin));

  // The way back. Without it the only exit from a demo is clearing a cookie by
  // hand, because the internal switch that clears it is not reachable here.
  if (slug === LIVLAB_TENANT.slug) {
    response.cookies.delete(TENANT_PREVIEW_COOKIE);
    return response;
  }

  if (!TENANTS[slug]?.publicDemo) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  response.cookies.set(TENANT_PREVIEW_COOKIE, slug, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });
  return response;
}
