'use client';

import { Component, ReactNode, useEffect, useRef, useState } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ModelViewerElement } from '@google/model-viewer';
import { AlertCircle, View } from 'lucide-react';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], weight: ['600', '700'] });

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
  productId: string;
  mountType?: 'wall' | 'floor';
  usdzUrl?: string;
}

function ARModelViewerInner({ modelUrl, label, productId, mountType, usdzUrl }: ARModelViewerProps) {
  const [scriptStatus, setScriptStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [modelStatus, setModelStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [arAvailable, setArAvailable] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const viewerRef = useRef<ModelViewerElement>(null);
  const arButtonRef = useRef<HTMLButtonElement>(null);
  const arHintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!usdzUrl) {
      console.warn(
        `[AR] Missing ios-src for product ${productId}, falling back to auto-generated USDZ — chất lượng material sẽ kém hơn`
      );
    }
  }, [productId, usdzUrl]);

  // canActivateAR resolves asynchronously (device/WebXR/Quick Look capability
  // checks), so poll briefly after the model loads instead of trusting an
  // immediate read — on desktop it settles to false and the button stays hidden.
  useEffect(() => {
    if (scriptStatus !== 'ready' || modelStatus !== 'loaded') return;
    const el = viewerRef.current;
    if (!el) return;

    let cancelled = false;
    let attempts = 0;
    const check = () => {
      if (cancelled) return;
      if (el.canActivateAR) {
        setArAvailable(true);
        return;
      }
      attempts += 1;
      if (attempts < 10) {
        setTimeout(check, 300);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [scriptStatus, modelStatus]);

  // Dismiss the one-time hint on any tap outside the AR button/hint area.
  useEffect(() => {
    if (!arAvailable || !hintVisible) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideButton = arButtonRef.current?.contains(target);
      const insideHint = arHintRef.current?.contains(target);
      if (!insideButton && !insideHint) {
        setHintVisible(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [arAvailable, hintVisible]);

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
          ios-src={usdzUrl}
          ar
          ar-modes="scene-viewer quick-look webxr"
          ar-scale="fixed"
          ar-placement={mountType === 'wall' ? 'wall' : undefined}
          camera-controls
          auto-rotate
          alt={label}
          style={{ width: '100%', height: '100%' }}
        >
          {arAvailable && hintVisible && (
            <p
              ref={arHintRef}
              className={`${plusJakartaSans.className} absolute bottom-16 right-4 bg-white/95 text-[#0B1623] text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm border border-[#D8E2EA] max-w-[220px] text-right`}
            >
              Mẹo: quét ở nơi đủ sáng, sàn trống để nhận diện nhanh hơn
            </p>
          )}
          {/*
            Always slotted (not gated on arAvailable): model-viewer's own
            ".slot.ar-button:not(.enabled)" CSS hides this whole slot until
            canActivateAR is true, which is what actually keeps the button off
            desktop. Conditionally omitting it here would leave the slot empty
            and fall through to model-viewer's default AR glyph button instead.
          */}
          <button
            ref={arButtonRef}
            slot="ar-button"
            type="button"
            onClick={() => setHintVisible(false)}
            className={`${plusJakartaSans.className} absolute bottom-4 right-4 flex items-center gap-2 bg-[#C97855] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-md hover:bg-[#B56844] transition-colors`}
          >
            <View className="w-3.5 h-3.5 flex-shrink-0" />
            Xem {label} trong phòng tắm của bạn
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
