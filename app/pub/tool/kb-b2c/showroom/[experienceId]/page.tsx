import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findTool } from '@/lib/storefront/manufacturerTools';
import { TEXT, TEXT_MUTED, DIVIDER } from '@/components/storefront/home/editorial';
import ToolFrame from './ToolFrame';

/**
 * LivLab's wrapper around a manufacturer's own simulator.
 *
 * The customer stays on a LivLab URL. What that URL resolves to comes from an
 * allowlist keyed by experience id — there is no parameter that could point
 * this page at another domain.
 *
 * Where the manufacturer's headers permit framing, their tool runs inside the
 * page. Where they do not, nothing is bypassed: the page says so and opens the
 * tool in a new tab. Either way LivLab serves none of the provider's HTML,
 * sockets, cookies or assets.
 */

export const metadata: Metadata = {
  title: 'Mô phỏng sản phẩm | LivLab',
  // The content belongs to the manufacturer; LivLab should not have a search
  // engine index a second copy of it.
  robots: { index: false, follow: false },
};

export default async function ManufacturerToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ experienceId: string }>;
  searchParams: Promise<{ account?: string }>;
}) {
  const { experienceId } = await params;
  const { account } = await searchParams;
  const tool = findTool(experienceId);

  if (!tool) notFound();
  // The account must be the one the allowlist records for this experience.
  if (tool.account && account && account !== tool.account) notFound();

  return (
    <div className="flex flex-col" style={{ height: '100svh' }}>
      <header
        className="flex shrink-0 items-center justify-between gap-6 px-5 md:px-10"
        style={{ height: 56, borderBottom: `1px solid ${DIVIDER}`, backgroundColor: '#FFFFFF' }}
      >
        <div className="flex min-w-0 items-baseline gap-4">
          <Link href={'/' as Route} style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.12em', color: TEXT }}>
            LIVLAB
          </Link>
          <span className="truncate" style={{ fontSize: 13, color: TEXT }}>{tool.label}</span>
        </div>
        <span className="hidden shrink-0 sm:block" style={{ fontSize: 11, color: TEXT_MUTED }}>
          {tool.attribution}
        </span>
      </header>

      {tool.embedStatus === 'EMBED_ALLOWED' ? (
        <ToolFrame src={tool.externalUrl} title={tool.label} attribution={tool.attribution} />
      ) : (
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-[460px] text-center">
            <h1 style={{ fontSize: 24, fontWeight: 500, color: TEXT }}>{tool.label}</h1>
            <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>
              Công cụ này sẽ được mở từ nền tảng mô phỏng của hãng.
            </p>
            <a
              href={tool.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 43,
                paddingInline: 24,
                backgroundColor: 'var(--tenant-accent)',
                color: 'var(--tenant-accent-contrast)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '.08em',
              }}
            >
              MỞ MÔ PHỎNG →
            </a>
            <p className="mt-6" style={{ fontSize: 11, color: TEXT_MUTED }}>{tool.attribution}</p>
          </div>
        </main>
      )}
    </div>
  );
}
