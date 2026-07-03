import HotspotCalibratorClient from './HotspotCalibratorClient';

interface PageProps {
  searchParams: Promise<{ slug?: string }>;
}

export default async function HotspotCalibratorPage({ searchParams }: PageProps) {
  const { slug } = await searchParams;
  return <HotspotCalibratorClient initialSlug={slug} />;
}
