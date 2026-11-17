/**
 * Brand wordmarks available to the storefront.
 *
 * Collected from the demo source's public pages for an INTERNAL demo only —
 * LivLab does not own these marks, and the mapping back to where each came
 * from lives in public/demo/tungdang/brands/source-map.json.
 *
 * A brand with no asset here renders its name as text. Nothing is generated,
 * and no logo is fetched at render time.
 */
const BRAND_LOGOS: Record<string, string> = {
  TOTO: '/demo/tungdang/brands/toto.png',
  INAX: '/demo/tungdang/brands/inax.png',
  Huge: '/demo/tungdang/brands/huge.png',
};

/**
 * The marks were collected from Tùng Đăng's own site for its demo, and their
 * rights are not cleared for anything else, so only that storefront shows
 * them. Every other tenant gets the brand name as text.
 */
const LOGO_TENANTS = new Set(['tungdang']);

export function brandLogoFor(tenantId: string, brand: string): string | null {
  return LOGO_TENANTS.has(tenantId) ? BRAND_LOGOS[brand] ?? null : null;
}
