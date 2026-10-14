/**
 * Manufacturer simulators and configurators LivLab is allowed to open.
 *
 * An explicit allowlist, not a proxy. The wrapper route resolves an id from
 * this table and nothing else: there is no `?url=` parameter, and no caller
 * can get LivLab to frame an arbitrary domain.
 *
 * LivLab does not re-host these tools. The wrapper is a page on LivLab's
 * domain that either frames the manufacturer's own tool — when the
 * manufacturer's headers permit it — or hands the customer a link to it. No
 * provider HTML, websocket, cookie or asset is proxied.
 */

export type EmbedStatus = 'EMBED_ALLOWED' | 'EXTERNAL_ONLY' | 'FAILED';

export interface ManufacturerTool {
  id: string;
  provider: 'COOHOM' | 'TOTO';
  brand: string;
  /** What the customer is told they are opening. Never a raw provider URL. */
  label: string;
  attribution: string;
  experienceId: string;
  account?: string;
  externalUrl: string;
  /**
   * Measured, not assumed. Coohom serves the showroom experience with no
   * X-Frame-Options and no frame-ancestors, so it frames; TOTO's planner
   * answers `X-Frame-Options: SAMEORIGIN`, so it cannot and is opened out.
   */
  embedStatus: EmbedStatus;
  embedCheckedAt: string;
}

export const MANUFACTURER_TOOLS: Record<string, ManufacturerTool> = {
  '3FO4K4V3BS58': {
    id: '3FO4K4V3BS58',
    provider: 'COOHOM',
    brand: 'INAX',
    label: 'Mô phỏng sản phẩm INAX',
    attribution: 'Công cụ mô phỏng của INAX',
    experienceId: '3FO4K4V3BS58',
    account: '3FO4K51358P3',
    externalUrl: 'https://www.coohom.com/pub/tool/kb-b2c/showroom/3FO4K4V3BS58?account=3FO4K51358P3',
    embedStatus: 'EMBED_ALLOWED',
    embedCheckedAt: '2026-10-13',
  },
  'toto-faucet-lavatory': {
    id: 'toto-faucet-lavatory',
    provider: 'TOTO',
    brand: 'TOTO',
    label: 'Công cụ chọn vòi lavabo TOTO',
    attribution: 'Công cụ mô phỏng của TOTO',
    experienceId: 'toto-faucet-lavatory',
    externalUrl: 'https://vn.toto.com/gb_faucet/planning/faucet-lavatory/',
    embedStatus: 'EXTERNAL_ONLY',
    embedCheckedAt: '2026-10-13',
  },
};

export const findTool = (id: string): ManufacturerTool | undefined => MANUFACTURER_TOOLS[id];
