import { Be_Vietnam_Pro } from 'next/font/google';
import type { TenantFontId } from './tenantExperience';

/**
 * Typefaces a storefront can be set in.
 *
 * Self-hosted by `next/font` at build time, so a tenant's typeface costs no
 * request to a third party at runtime. `preload` is off: the face is declared
 * for every page but only downloaded where something is actually set in it,
 * so the LivLab storefront, which never uses it, never fetches it.
 *
 * Be Vietnam Pro is drawn with Vietnamese diacritics as part of the design
 * rather than bolted on, which is exactly what a Vietnamese retailer's
 * storefront needs at display sizes.
 */
const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  preload: false,
  variable: '--font-be-vietnam-pro',
});

interface FontRegistration {
  /** Class that declares the CSS variable; goes on <html>. */
  className: string;
  /** The family stack the storefront is set in. */
  family: string;
}

const FONTS: Record<Exclude<TenantFontId, 'inter'>, FontRegistration> = {
  beVietnamPro: {
    className: beVietnamPro.variable,
    family: `var(--font-be-vietnam-pro), 'Inter', system-ui, sans-serif`,
  },
};

/** The registration for a tenant's font, or null for the default (Inter). */
export function tenantFont(id: TenantFontId | undefined): FontRegistration | null {
  if (!id || id === 'inter') return null;
  return FONTS[id];
}
