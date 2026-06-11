'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Product3DCategory } from '@/lib/livlabProductModels';
// @ts-ignore
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

let ktx2Loader: any = null;

interface ProductModel3DProps {
  modelUrl: string;
  productName?: string;
  category?: Product3DCategory;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  onError?: () => void;
  onSuccess?: () => void;
}

class ModelErrorBoundary extends React.Component<{ onError?: () => void, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Failed to load 3D model:", error);
    if (this.props.onError) this.props.onError();
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function ModelLoader({ modelUrl, position, scale, onSuccess }: { modelUrl: string, position?: [number, number, number], scale?: number | [number, number, number], onSuccess?: () => void }) {
  const gl = useThree((state) => state.gl);
  
  const { scene } = useGLTF(modelUrl, true, true, (loader: any) => {
    if (!ktx2Loader) {
      ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/basis/');
      ktx2Loader.detectSupport(gl);
    }
    loader.setKTX2Loader(ktx2Loader);
  });
  
  useEffect(() => {
    if (scene && onSuccess) {
      onSuccess();
    }
  }, [scene, onSuccess]);

  return (
    <group position={position} scale={scale}>
      <Center>
        <primitive object={scene.clone()} />
      </Center>
    </group>
  );
}

export default function ProductModel3D({ modelUrl, position, scale, onError, onSuccess }: ProductModel3DProps) {
  return (
    <ModelErrorBoundary onError={onError}>
      <Suspense fallback={null}>
        <ModelLoader modelUrl={modelUrl} position={position} scale={scale} onSuccess={onSuccess} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
