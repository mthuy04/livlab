import type { Metadata } from 'next';
import PipelineTestClient from './PipelineTestClient';

/**
 * Dev-only QA surface for the Room Studio runtime GLB path.
 *
 * Not linked from anywhere, not in any navigation, and noindex — it exists so
 * a person can look at the pipeline, not so anyone can find it. The repo has
 * no sitemap and no robots route, so `robots` here is the whole of it.
 */
export const metadata: Metadata = {
  title: 'Room Studio 3D pipeline test (dev)',
  robots: { index: false, follow: false },
};

export default function RoomStudio3DTestPage() {
  return <PipelineTestClient />;
}
