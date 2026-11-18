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
  /** Catalogue categories the tool actually configures. Absent: any of the brand's. */
  categories?: string[];
  /**
   * Whether the tool is published by the manufacturer itself (on its own
   * domain). A third-party experience is named for where it runs, never
   * presented as the manufacturer's.
   */
  official: boolean;
}

export const MANUFACTURER_TOOLS: Record<string, ManufacturerTool> = {
  '3FO4K4V3BS58': {
    id: '3FO4K4V3BS58',
    provider: 'COOHOM',
    brand: 'INAX',
    // A Coohom showroom experience featuring INAX products. That INAX
    // publishes it could not be confirmed (2026-11-18), so it is named for
    // the platform it runs on.
    label: 'Mô phỏng 3D trên Coohom',
    attribution: 'Coohom — nền tảng 3D bên thứ ba, không phải website INAX',
    experienceId: '3FO4K4V3BS58',
    account: '3FO4K51358P3',
    externalUrl: 'https://www.coohom.com/pub/tool/kb-b2c/showroom/3FO4K4V3BS58?account=3FO4K51358P3',
    embedStatus: 'EMBED_ALLOWED',
    embedCheckedAt: '2026-10-13',
    official: false,
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
    // A faucet planner: shown on faucet and basin pages only, not on a toilet.
    categories: ['Vòi lavabo', 'Lavabo'],
    official: true,
  },
};

export const findTool = (id: string): ManufacturerTool | undefined => MANUFACTURER_TOOLS[id];
