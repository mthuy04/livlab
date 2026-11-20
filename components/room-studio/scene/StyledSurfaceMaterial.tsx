'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DEFAULT_SURFACE_STYLES,
  resolveSurfaceMaterial,
  type SurfaceStyle,
  type SurfaceId,
} from '@/lib/room-studio/materials';
import { STYLE_IDS, STYLE_PACKS, type StylePackId } from '@/lib/room-studio/stylePacks';
import { useSurfaceMaps } from './useSurfaceMaps';

// All fields are evaluated in metres across the entire wall. An opening adds
// triangles but does not restart the grain or grout at either jamb.
const field = `
varying vec2 llUV;
uniform vec2 llSize;
uniform vec3 llWeights;
uniform sampler2D llMinerals;
uniform float llHasMinerals;
float llHash(vec2 p) {
  vec3 h = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
  h += dot(h,h.yzx+33.33);
  return fract((h.x+h.y)*h.z);
}
void llStone(vec2 m, int kind, bool wall, vec2 slab, float joint,
  vec3 base, vec3 mineral, float rough, out vec3 albedo, out float gloss, out float relief) {
  vec2 cell=floor(m/slab);
  float seed=llHash(cell+float(kind)*16.3);
  vec2 p=m/vec2(1.68,1.22);
  p.x*=seed>.5?-1.:1.;
  p+=vec2(seed*4.23,seed*7.12);
  vec3 stone=llHasMinerals>.5 ? texture2D(llMinerals,p).rgb : vec3(.45,0.,.5);
  float cloud=stone.b;
  float grain=cloud;
  #ifdef LL_FINE
    if(llHasMinerals>.5) grain=texture2D(llMinerals,p*3.13).b;
  #endif
  float tone;
  if(kind==0) {
    float bedding=smoothstep(.17,.77,stone.r);
    tone=wall ? .05+.71*bedding+.12*grain : .14+.30*bedding+.16*cloud;
    relief=bedding*.30+grain*.07;
  } else if(kind==1) {
    tone=(wall?.23:.35)*cloud+.065*grain;
    relief=.09*grain;
  } else {
    tone=wall ? .21*cloud+.86*stone.g+.06*grain : .35*cloud+.13*grain;
    relief=.08*grain+.12*stone.g;
  }
  vec2 edge=(.5-abs(fract(m/slab)-.5))*slab;
  float dist=min(edge.x,edge.y);
  float aa=max(.0003,min(.004,fwidth(dist)));
  float grout=joint>0.?1.-smoothstep(joint*.5-aa,joint*.5+aa,dist):0.;
  albedo=mix(base,mineral,clamp(tone,0.,1.))*(.95+.085*cloud+.05*seed);
  albedo=mix(albedo,mix(base,mineral,.52)*.82,grout*.78);
  // Low-frequency ambient occlusion at plane junctions, in room metres.
  float side=min(m.x,llSize.x-m.x);
  float edgeDistance=wall?min(side,m.y):min(side,llSize.y-m.y);
  albedo*=.78+.22*smoothstep(0.,.24,max(0.,edgeDistance));
  gloss=clamp(rough+.10*(cloud-.5)+grout*.14,.08,.96);
  relief-=grout*.55;
}
`;
const number = (v: number) => v.toFixed(5);
const linear = (hex: string) => 'vec3(' + new THREE.Color(hex).toArray().map(number).join(',') + ')';

export function motionFraction(dt: number, reduced: boolean) {
  return reduced ? 1 : 1 - Math.exp(-Math.max(0, dt) * 13);
}

export default function StyledSurfaceMaterial({
  style,
  mineralMap,
  pack,
  role,
  width,
  height,
  resolution,
  tint,
  doubleSided,
}: {
  style: SurfaceStyle;
  mineralMap: THREE.Texture | null;
  pack?: StylePackId;
  role: SurfaceId;
  width: number;
  height: number;
  resolution: number;
  tint: number;
  doubleSided?: boolean;
}) {
  // Retain the last manual map as the base of the transition into a pack.
  // Pack-to-pack switches use shader uniforms and allocate no canvas textures.
  const [manual, setManual] = useState(pack ? DEFAULT_SURFACE_STYLES[role] : style);
  if (!pack && manual !== style) setManual(style);
  const descriptor = resolveSurfaceMaterial(manual);
  const maps = useSurfaceMaps(descriptor, width, height, resolution);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)'), []);
  const goal = useMemo(() => new THREE.Vector3(...STYLE_IDS.map((id) => Number(id === pack))), [pack]);
  const uniforms = useRef({
    llWeights: { value: goal.clone() },
    llMinerals: { value: mineralMap },
    llHasMinerals: { value: Number(!!mineralMap) },
    llSize: { value: new THREE.Vector2(width, height) },
  });
  const lastFrame = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    uniforms.current.llMinerals.value = mineralMap;
    uniforms.current.llHasMinerals.value = Number(!!mineralMap);
    uniforms.current.llSize.value.set(width, height);
    lastFrame.current = performance.now();
    invalidate();
  }, [uniforms, width, height, goal, mineralMap, invalidate]);
  useFrame((state) => {
    const w = uniforms.current.llWeights.value;
    if (w.distanceToSquared(goal) > 1e-9) {
      const now = performance.now();
      w.lerp(goal, motionFraction((now - lastFrame.current) / 1000, reduced.matches));
      lastFrame.current = now;
      if (w.distanceToSquared(goal) < 1e-5) w.copy(goal);
      state.invalidate();
    }
    if (material.current) material.current.bumpScale = 0.6 * Math.max(0, 1 - w.x - w.y - w.z);
  });
  const compiled = useMemo(() => {
    const samples = STYLE_IDS.map((id, index) => {
      const spec = STYLE_PACKS[id][role],
        weight = 'llWeights.' + 'xyz'[index];
      return `if(${weight}>0.00001){
        llStone(llUV*llSize,${index},${role === 'walls'},vec2(${spec.slab.map(number)}),${number(spec.joint)},
          ${linear(spec.base)},${linear(spec.mineral)},${number(spec.roughness)},llAlbedo,llR,llH);
        llColor+=llAlbedo*${weight}; llRough+=llR*${weight}; llHeight+=llH*${weight};
      }`;
    }).join('\n');
    return (shader: THREE.WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, uniforms.current);
      shader.vertexShader =
        'varying vec2 llUV;\n' +
        shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nllUV=uv;');
      shader.fragmentShader =
        (resolution >= 1024 ? '#define LL_FINE\n' : '') +
        field +
        shader.fragmentShader
          .replace(
            '#include <map_fragment>',
            `#include <map_fragment>
          float llManual=clamp(1.-dot(llWeights,vec3(1.)),0.,1.);
          vec3 llColor=vec3(0.),llAlbedo; float llRough=0.,llR,llH,llHeight=0.;
          ${samples}
          diffuseColor.rgb=diffuseColor.rgb*llManual+llColor;
        `
          )
          .replace(
            '#include <roughnessmap_fragment>',
            '#include <roughnessmap_fragment>\nroughnessFactor=roughnessFactor*llManual+llRough;'
          )
          .replace(
            '#include <normal_fragment_maps>',
            `#include <normal_fragment_maps>
          #if defined(USE_BUMPMAP) && defined(LL_FINE)
            normal=perturbNormalArb(-vViewPosition,normal,.12*vec2(dFdx(llHeight),dFdy(llHeight)),faceDirection);
          #endif`
          );
    };
  }, [role, resolution, uniforms]);
  const key = 'livlab-surface-v1/' + role + '/' + resolution;
  return (
    <meshStandardMaterial
      ref={material}
      onBeforeCompile={compiled}
      customProgramCacheKey={() => key}
      side={doubleSided ? THREE.DoubleSide : THREE.FrontSide}
      map={maps?.map}
      roughnessMap={maps?.roughnessMap}
      bumpMap={maps?.bumpMap}
      roughness={maps ? 1 : descriptor.roughness}
      metalness={descriptor.metalness}
      color={maps ? new THREE.Color().setRGB(tint, tint, tint, THREE.SRGBColorSpace) : descriptor.baseColor}
    />
  );
}
