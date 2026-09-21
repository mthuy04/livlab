'use client';

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { PlacedProduct } from '@/lib/room-studio/roomState';
import { getRealWorldSize, resolveModelScale } from '@/lib/room-studio/assetResolver';

/** Category tints for the footprint volume, matched to the LivLab palette. */
const CATEGORY_TINT: Record<string, string> = {
  lavabo: '#7FA8C4',
  faucet: '#C8A96A',
  toilet: '#8FB0A0',
  shower: '#9AA7C4',
  mirror: '#B9C6CE',
  vanity: '#C0A88C',
  lighting: '#E2C98B',
};

function tintFor(category: string): string {
  return CATEGORY_TINT[category] ?? '#9FB0BD';
}

/**
 * A GLB rendered at true real-world scale.
 *
 * The asset is measured, then scaled so its largest dimension matches the
 * product's real-world largest dimension — so a .glb authored in millimetres and
 * one authored in metres both come out correct. The scale factor itself is
 * computed by assetResolver; nothing here hardcodes a number.
 */
function GlbProduct({ product, selected }: { product: RoomStudioProduct; selected: boolean }) {
  const { scene } = useGLTF(product.model3dUrl!);

  // One clone per instance so two copies of the same SKU can be placed and moved
  // independently. Geometries and materials stay shared with drei's cache on
  // purpose — disposing them here would blank out every other instance.
  const instance = useMemo(() => scene.clone(true), [scene]);

  const { scale, yOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(instance);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = resolveModelScale(product, { x: size.x, y: size.y, z: size.z });
    // Re-centre on the model's own bounding box so the stored position always
    // means "centre of the product", whatever pivot the asset was authored with.
    return { scale: s, yOffset: center.clone().multiplyScalar(-s) };
  }, [instance, product]);

  return (
    <group>
      <group position={[yOffset.x, yOffset.y, yOffset.z]} scale={scale}>
        <primitive object={instance} />
      </group>
      {selected && <SelectionFrame product={product} />}
    </group>
  );
}

/** Wireframe box at the product's true footprint — the selection affordance. */
function SelectionFrame({ product }: { product: RoomStudioProduct }) {
  const size = getRealWorldSize(product);
  return (
    <mesh>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshBasicMaterial color="#C8A96A" wireframe transparent opacity={0.85} />
    </mesh>
  );
}

/**
 * Stand-in for a product that has no 3D asset yet.
 *
 * It is drawn at the product's true real-world size, so it still answers the
 * question the Room Studio exists for — "does this fit?" — and it is visually
 * honest about being a placeholder rather than pretending to be a render.
 */
function ProductPlaceholder({ product, selected }: { product: RoomStudioProduct; selected: boolean }) {
  const size = getRealWorldSize(product);
  const color = tintFor(product.normalizedCategory);

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial color={color} transparent opacity={selected ? 0.55 : 0.4} roughness={0.5} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size.width, size.height, size.depth)]} />
        <lineBasicMaterial color={selected ? '#C8A96A' : color} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

/** Shown while a GLB downloads, at the size the product will end up occupying. */
function LoadingVolume({ product }: { product: RoomStudioProduct }) {
  const size = getRealWorldSize(product);
  return (
    <mesh>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshStandardMaterial color="#C8D5DE" transparent opacity={0.35} />
    </mesh>
  );
}

/** Keeps one failed asset from taking the whole Canvas down with it. */
class ModelBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[Room Studio] model failed to load:', error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface PlacedProductNodeProps {
  placed: PlacedProduct;
  product: RoomStudioProduct;
  selected: boolean;
  onSelect: (instanceId: string) => void;
  onDragStart: (instanceId: string, grabOffset: [number, number, number]) => void;
}

export default function PlacedProductNode({
  placed,
  product,
  selected,
  onSelect,
  onDragStart,
}: PlacedProductNodeProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(placed.instanceId);
    // Remember where inside the product the customer grabbed it, so it does not
    // snap its centre to the cursor the moment the drag begins.
    onDragStart(placed.instanceId, [
      placed.position[0] - e.point.x,
      placed.position[1] - e.point.y,
      placed.position[2] - e.point.z,
    ]);
  };

  const showLabel = hovered || selected;

  return (
    <group
      ref={groupRef}
      position={placed.position}
      rotation={[0, placed.rotationY, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {product.model3dUrl ? (
        <ModelBoundary fallback={<ProductPlaceholder product={product} selected={selected} />}>
          <Suspense fallback={<LoadingVolume product={product} />}>
            <GlbProduct product={product} selected={selected} />
          </Suspense>
        </ModelBoundary>
      ) : (
        <ProductPlaceholder product={product} selected={selected} />
      )}

      {showLabel && (
        <Html
          position={[0, getRealWorldSize(product).height / 2 + 0.12, 0]}
          center
          distanceFactor={4}
          pointerEvents="none"
          zIndexRange={[20, 0]}
        >
          <div className="pointer-events-none whitespace-nowrap rounded-lg bg-[#0B1623]/90 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
            {product.name.length > 34 ? `${product.name.slice(0, 34)}…` : product.name}
          </div>
        </Html>
      )}
    </group>
  );
}
