'use client';

import { Component, ReactNode, useEffect, useRef, useState } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { AlertCircle, View } from 'lucide-react';

function ARModelViewerFallback() {
  return (
    <div className="w-full aspect-square rounded-2xl border border-[#D8E2EA] bg-[#EEF4F7] flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="w-8 h-8 text-[#627386] mb-2 opacity-60" />
      <p className="text-sm text-[#627386] font-medium">Không thể tải xem trước 3D lúc này</p>
    </div>
  );
}

// Mirrors the CanvasErrorBoundary pattern in components/visual-studio/ProductRoom3D.tsx:
// a render-time crash in this subtree shows the Vietnamese fallback instead of
// taking down the rest of the product page.
class ARModelViewerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[ARModelViewer] crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return <ARModelViewerFallback />;
    }
    return this.props.children;
  }
}

interface ARModelViewerProps {
  modelUrl: string;
  label: string;
}

function ARModelViewerInner({ modelUrl, label }: ARModelViewerProps) {
  const [scriptStatus, setScriptStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [modelStatus, setModelStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const viewerRef = useRef<ModelViewerElement>(null);

  // Side-effect import registers the <model-viewer> custom element. Kept
  // local to this component (no next/script, no global layout changes) so
  // pages without a 3D model never pay for it.
  useEffect(() => {
    let cancelled = false;
    // Meshopt-compressed .glb files need an explicit decoder location —
    // model-viewer only auto-configures Draco/KTX2 (Google-CDN defaults),
    // never Meshopt. Must be set before the <model-viewer> element is
    // constructed, so it runs ahead of the import resolving.
    window.ModelViewerElement = window.ModelViewerElement || {};
    window.ModelViewerElement.meshoptDecoderLocation = '/vendor/meshopt-decoder.js';
    import('@google/model-viewer')
      .then(() => {
        if (!cancelled) setScriptStatus('ready');
      })
      .catch((error) => {
        console.error('[ARModelViewer] failed to load model-viewer script:', error);
        if (!cancelled) setScriptStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // model-viewer reports load/decode failures via DOM events, not thrown
  // exceptions, so the error boundary above can't catch them — listen directly.
  useEffect(() => {
    if (scriptStatus !== 'ready') return;
    const el = viewerRef.current;
    if (!el) return;

    setModelStatus('loading');
    const handleLoad = () => setModelStatus('loaded');
    const handleError = (event: Event) => {
      console.error('[ARModelViewer] model failed to load:', modelUrl, event);
      setModelStatus('error');
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);
    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
    };
  }, [scriptStatus, modelUrl]);

  if (scriptStatus === 'error' || modelStatus === 'error') {
    return <ARModelViewerFallback />;
  }

  const isLoading = scriptStatus !== 'ready' || modelStatus === 'loading';

  return (
    <div className="relative w-full aspect-square rounded-2xl border border-[#D8E2EA] bg-[#EEF4F7] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EEF4F7] animate-pulse">
          <div className="w-10 h-10 rounded-full border-2 border-[#D8E2EA] border-t-[#123C5A] animate-spin" />
        </div>
      )}
      {scriptStatus === 'ready' && (
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          ar
          ar-modes="scene-viewer quick-look webxr"
          camera-controls
          auto-rotate
          alt={label}
          style={{ width: '100%', height: '100%' }}
        >
          <button
            slot="ar-button"
            type="button"
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-[#123C5A] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-md hover:bg-[#0D2B42] transition-colors"
          >
            <View className="w-4 h-4" />
            Xem trong không gian của bạn
          </button>
        </model-viewer>
      )}
    </div>
  );
}

export default function ARModelViewer(props: ARModelViewerProps) {
  return (
    <ARModelViewerErrorBoundary>
      <ARModelViewerInner {...props} />
    </ARModelViewerErrorBoundary>
  );
}
