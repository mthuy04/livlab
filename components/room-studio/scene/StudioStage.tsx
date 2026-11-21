'use client';

/**
 * The studio the bathroom stands in: an architectural model on a plinth,
 * sitting on a soft warm-grey floor that fades into the backdrop behind the
 * canvas, with one broad contact shadow anchoring it.
 *
 * Everything here is outside the room. The plinth's top sits 2 mm under the
 * room's floor and reaches 14 cm past the room's inner faces (4 cm past the
 * wall caps), so it never touches the floor, a wall or a product; the studio
 * floor is the plinth's height lower still. Nothing here touches a product's
 * material or geometry — it is the stage, not the set.
 */
import { useEffect, useMemo } from 'react';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';

/** Plinth height: the room reads as a model, not as floor tiles floating in space. */
const PLINTH = 0.16;
/** How far the plinth reaches past the room's inner faces (walls' caps are 10 cm). */
const REVEAL = 0.14;
/** Studio floor colour, matched to the backdrop so its edge disappears. */
const STUDIO_FLOOR = '#E4E0DA';

export default function StudioStage({ dimensions, quality }: { dimensions: RoomDimensions; quality: 'high' | 'low' }) {
  const { length, width } = dimensions;
  const span = Math.max(length, width);

  // Unlit and untone-mapped, so its colour is exactly the backdrop's at the
  // fade-out; a gentle pool of light under the model, falling off outward.
  const floor = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'LivLabStudioFloor',
        uniforms: {
          tint: { value: new THREE.Color(STUDIO_FLOOR) },
          inner: { value: span * 0.65 },
          outer: { value: span * 2.6 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vPos;
          void main() {
            vPos = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 tint;
          uniform float inner;
          uniform float outer;
          varying vec2 vPos;
          void main() {
            float r = length(vPos);
            float fade = 1.0 - smoothstep(inner, outer, r);
            float pool = 1.0 + 0.035 * (1.0 - smoothstep(0.0, inner * 1.4, r));
            gl_FragColor = vec4(tint * pool, fade);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [span]
  );
  useEffect(() => () => floor.dispose(), [floor]);

  return (
    <group>
      {/* The plinth. */}
      <mesh position={[0, -PLINTH / 2 - 0.002, 0]} receiveShadow castShadow>
        <boxGeometry args={[length + REVEAL * 2, PLINTH, width + REVEAL * 2]} />
        <meshStandardMaterial color="#D3D5D6" roughness={0.9} metalness={0} />
      </mesh>
      {/* The studio floor, fading into the backdrop. */}
      <mesh position={[0, -PLINTH - 0.003, 0]} rotation-x={-Math.PI / 2} material={floor} renderOrder={-2}>
        <circleGeometry args={[span * 2.6, 96]} />
      </mesh>
      {/* One broad, soft shadow under the whole model. Its capture plane sits
          just under the plinth's underside, so the plinth is seen from below
          and casts; inside the box nothing would. */}
      <ContactShadows
        position={[0, -PLINTH - 0.0025, 0]}
        scale={[length + 3.2, width + 3.2]}
        resolution={quality === 'high' ? 1024 : 512}
        blur={3.2}
        far={1.6}
        opacity={0.68}
        color="#3A3530"
      />
    </group>
  );
}
