'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { Product3DCategory } from '@/lib/livlabProductModels';

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
  const { scene } = useGLTF(modelUrl);
  
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
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Check if the file exists before attempting to load it with useGLTF
    // to prevent useGLTF from throwing a 404 error that triggers Next.js Error Overlay.
    fetch(modelUrl, { method: 'HEAD' })
      .then(res => {
        if (!isMounted) return;
        if (res.ok) {
          setFileExists(true);
        } else {
          setFileExists(false);
          if (onError) onError();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setFileExists(false);
        if (onError) onError();
      });
      
    return () => { isMounted = false; };
  }, [modelUrl, onError]);

  if (fileExists === null) return null;
  if (fileExists === false) return null;

  return (
    <ModelErrorBoundary onError={onError}>
      <Suspense fallback={null}>
        <ModelLoader modelUrl={modelUrl} position={position} scale={scale} onSuccess={onSuccess} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
