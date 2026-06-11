import ConceptDetailClient from './ConceptDetailClient';

interface PageProps { params: Promise<{ slug: string }>; }

export default async function ConceptDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ConceptDetailClient slug={slug} />;
}
