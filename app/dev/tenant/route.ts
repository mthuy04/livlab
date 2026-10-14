import { NextResponse } from 'next/server';
import { TENANTS } from '@/lib/storefront/tenantConfig';
import { TENANT_PREVIEW_COOKIE, tenantPreviewEnabled } from '@/lib/storefront/resolveTenant';

/**
 * Internal storefront preview switch.
 *
 * A root layout never receives searchParams — only pages do — so a `?tenant=`
 * query cannot reach tenant resolution. This route records the choice in a
 * cookie instead, which the layout can read on every request.
 *
 * Presentation only: it selects which branding to paint and grants no access
 * to anything. It is still gated, because a customer stumbling onto another
 * showroom's storefront would undermine the whole white-label promise.
 *
 *   /dev/tenant?slug=luxbath   switch
 *   /dev/tenant?slug=          clear
 */
export async function GET(request: Request) {
  if (!tenantPreviewEnabled()) {
    return NextResponse.json({ error: 'Not available.' }, { status: 404 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? '';
  const redirectTo = url.searchParams.get('next') ?? '/';

  // Only same-origin paths: an absolute URL here would be an open redirect.
  const safeNext = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
  const response = NextResponse.redirect(new URL(safeNext, url.origin));

  if (!slug) {
    response.cookies.delete(TENANT_PREVIEW_COOKIE);
    return response;
  }
  if (!TENANTS[slug]) {
    return NextResponse.json(
      { error: `Unknown tenant "${slug}".`, available: Object.keys(TENANTS) },
      { status: 400 }
    );
  }

  response.cookies.set(TENANT_PREVIEW_COOKIE, slug, { path: '/', httpOnly: false, sameSite: 'lax' });
  return response;
}
