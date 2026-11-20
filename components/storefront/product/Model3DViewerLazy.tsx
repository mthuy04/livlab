'use client';

import dynamic from 'next/dynamic';
import type { Model3DViewerProps } from './Model3DViewer';

/** three.js loads only on a page that has a model, and only in the browser. */
const Viewer = dynamic(() => import('./Model3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex w-full items-center justify-center" style={{ aspectRatio: '4 / 3', backgroundColor: '#F4F4F2' }}>
      <span style={{ fontSize: 13, color: '#6B6B6B' }}>Đang tải mô hình 3D…</span>
    </div>
  ),
});

export default function Model3DViewerLazy(props: Model3DViewerProps) {
  return <Viewer {...props} />;
}
