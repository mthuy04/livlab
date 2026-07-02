import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';

// @google/model-viewer ships HTMLElementTagNameMap typings but no React/JSX
// typings, so <model-viewer> errors in TSX without this augmentation.
// React 19's JSX namespace lives on the "react" module (not the global
// scope), so it must be augmented here rather than via `declare global`.
type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
  src: string;
  'ios-src'?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: 'auto' | 'fixed';
  'ar-placement'?: 'floor' | 'wall';
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  alt?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

// Global pre-load config hook documented by @google/model-viewer
// (lib/features/loading.d.ts ModelViewerGlobalConfig) for pointing the
// DRACO/KTX2/Meshopt decoders at a non-default location.
declare global {
  interface Window {
    ModelViewerElement?: {
      meshoptDecoderLocation?: string;
      dracoDecoderLocation?: string;
      ktx2TranscoderLocation?: string;
    };
  }
}
