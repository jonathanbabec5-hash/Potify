import { SurfaceBlock, surface } from './Surfaces';
import botanical from '../assets/surfaces/botanical.webp';
import { cropGeometry } from './cropGeometry';
import { SolidSurfaces } from './SolidSurfaces';
import { memo, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SEEDS } from '@/game/store';
import { useG } from '@/game/runtime';
import { BEDS } from '@/game/world';
import { mat } from '@/scene/materials';

interface BedView { strain: string | null; growth: number; water: number; health: number; fed: boolean }

export function Beds() {
  useFrame(state => { wind.value = state.clock.elapsedTime; });
  const plots = useG(s => s.plots.map(p => ({
    strain: p.strain, growth: Math.min(100, Math.floor(p.growth / 4) * 4), water: Math.round(p.water / 10) * 10,
    health: Math.round(p.health / 10) * 10, fed: p.fed,
  })));
  const bigBeds = useG(s => s.upgrades.includes('beds'));
  return (
    <>
      {BEDS.slice(0, plots.length).map(b => (
        <Bed key={b.index} x={b.x} z={b.z} big={bigBeds} {...(plots[b.index] ?? { strain: null, growth: 0, water: 0, health: 100, fed: false })} />
      ))}
    </>
  );
}

const Bed = memo(function Bed({ x, z, big, strain, growth, water, health, fed }: BedView & { x: number; z: number; big: boolean }) {
  const soil = useMemo(() => new THREE.Color('#ffefce').lerp(new THREE.Color('#958371'), water / 100).getStyle(), [water]);
  const seed = SEEDS.find(s => s.id === strain);
  return (
    <group position={[x, 0, z]}>
      <SolidSurfaces revision={String(big)}>
        {[-0.77, 0.77].map(z => [0.17, 0.44].map((y, i) => (
          <SurfaceBlock key={z+'/'+y} at={[0,y,z]} size={[2.6,0.26,0.075]} finish="cedar" color={i?'#e3c29e':'#d6b08c'}/>
        )))}
        {[-1.26,1.26].map(x => <SurfaceBlock key={x} at={[x,0.29,0]} size={[0.08,0.56,1.52]} finish="cedar" />)}
        {[-1.25,1.25].map(x => [-0.77,0.77].map(z => <mesh key={x+'/'+z} position={[x,0.30,z]}
          material={mat(big ? '#405947' : '#514738')}><boxGeometry args={[0.12,0.59,0.11]} /></mesh>))}
      </SolidSurfaces>
      <mesh position={[0, 0.52, 0]} material={surface('loam',soil)} receiveShadow>
        <boxGeometry args={[2.46, 0.06, 1.46]} />
      </mesh>
      {fed && <mesh position={[0.8,0.56,0.48]} material={mat('#876643')}><icosahedronGeometry args={[0.06,0]}/></mesh>}
      {seed && <CropRow strain={seed.id} growth={growth} health={health} />}
      {strain && <mesh position={[1.07,0.57,0.54]} rotation-x={-0.29} material={mat(water<30?'#79a2a6':health<40?'#ab7954':'#dacba8')}>
        <boxGeometry args={[0.12,0.23,0.018]}/>
      </mesh>}
    </group>
  );
});

const botanicalMap = new THREE.TextureLoader().load(botanical);
botanicalMap.colorSpace = THREE.SRGBColorSpace;
botanicalMap.anisotropy = 4;
export const foliage = new THREE.MeshLambertMaterial({ map: botanicalMap, vertexColors: true, side: THREE.DoubleSide, alphaTest: 0.38 });
const wind = { value: 0 };
foliage.onBeforeCompile = shader => {
  shader.uniforms.cropTime = wind;
  shader.vertexShader = 'uniform float cropTime;\n' + shader.vertexShader.replace('#include <begin_vertex>',
    `#include <begin_vertex>
     #ifdef USE_INSTANCING
     transformed.x += 0.018 * position.y * position.y * sin(cropTime * 1.6 + instanceMatrix[3].x * 2.0 + modelMatrix[3].z);
     #endif
     `);
};
const mobileCrops = window.matchMedia('(pointer: coarse)').matches;
const dummy = new THREE.Object3D();
function CropRow({ strain, growth, health }: { strain: string; growth: number; health: number }) {
  const stage = growth < 6 ? 0 : growth < 25 ? 1 : growth < 60 ? 2 : growth < 88 ? 3 : 4;
  const tired = health < 40;
  const geometry = useMemo(() => cropGeometry(stage, strain, tired), [stage, strain, tired]);
  const coarse = useMemo(() => cropGeometry(stage,strain,tired,true), [stage,strain,tired]);
  const center = useMemo(() => new THREE.Vector3(), []);
  const row = useRef<THREE.InstancedMesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => coarse.dispose(), [coarse]);
  useFrame(({camera}) => {
    const plants = row.current;
    if (!plants) return;
    plants.getWorldPosition(center);
    plants.geometry = center.distanceToSquared(camera.position) > 20 ? coarse : geometry;
  });
  useLayoutEffect(() => {
    const plants = row.current!;
    for (let i = 0; i < 3; i++) {
      dummy.position.set((i-1)*0.78,0.55,i === 1 ? -0.07 : 0.08);
      dummy.rotation.set(0, i*2.16, (i-1)*0.035);
      dummy.scale.setScalar(0.94+i*0.06);
      dummy.updateMatrix();
      plants.setMatrixAt(i,dummy.matrix);
    }
    plants.instanceMatrix.needsUpdate = true;
    plants.computeBoundingSphere();
  }, [geometry]);
  return <instancedMesh ref={row} args={[geometry, foliage, 3]} castShadow={!mobileCrops} receiveShadow={!mobileCrops} />;
}
