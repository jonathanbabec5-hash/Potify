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
  const soil = useMemo(() => new THREE.Color('#796044').lerp(new THREE.Color('#38291d'), water / 100).getStyle(), [water]);
  const seed = SEEDS.find(s => s.id === strain);
  const ready = !!strain && growth >= 100;
  return (
    <group position={[x, 0, z]}>
      <SolidSurfaces revision={String(big)}>
        {[-0.77, 0.77].map(z => [0.17, 0.44].map((y, i) => (
          <mesh key={z + '/' + y} position={[0, y, z]} material={mat(i ? '#906440' : '#795138')} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.26, 0.075]} />
          </mesh>
        )))}
        {[-1.26, 1.26].map(x => <mesh key={x} position={[x,0.29,0]} material={mat('#875e40')} castShadow receiveShadow>
          <boxGeometry args={[0.08,0.56,1.52]} /></mesh>)}
        {[-1.25,1.25].map(x => [-0.77,0.77].map(z => <mesh key={x+'/'+z} position={[x,0.30,z]}
          material={mat(big ? '#405947' : '#514738')}><boxGeometry args={[0.12,0.59,0.11]} /></mesh>))}
      </SolidSurfaces>
      <mesh position={[0, 0.52, 0]} material={mat(soil)} receiveShadow>
        <boxGeometry args={[2.46, 0.06, 1.46]} />
      </mesh>
      {fed && <mesh position={[0.8,0.56,0.48]} material={mat('#876643')}><icosahedronGeometry args={[0.06,0]}/></mesh>}
      {seed && <CropRow strain={seed.id} growth={growth} health={health} />}
      {strain && (ready || water < 30 || health < 40) && (
        <Flag y={growth >= 60 ? 2.6 : 1.7} color={ready ? '#c4a869' : water < 30 ? '#4fb3e8' : '#886951'} />
      )}
    </group>
  );
});

const foliage = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const wind = { value: 0 };
foliage.onBeforeCompile = shader => {
  shader.uniforms.cropTime = wind;
  shader.vertexShader = 'uniform float cropTime;\n' + shader.vertexShader.replace('#include <begin_vertex>',
    `#include <begin_vertex>
     transformed.x += 0.018 * position.y * position.y * sin(cropTime * 1.6 + instanceMatrix[3].x * 2.0 + modelMatrix[3].z);`);
};
const dummy = new THREE.Object3D();
function CropRow({ strain, growth, health }: { strain: string; growth: number; health: number }) {
  const stage = growth < 6 ? 0 : growth < 25 ? 1 : growth < 60 ? 2 : growth < 88 ? 3 : 4;
  const tired = health < 40;
  const geometry = useMemo(() => cropGeometry(stage, strain, tired), [stage, strain, tired]);
  const row = useRef<THREE.InstancedMesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
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
  return <instancedMesh ref={row} args={[geometry, foliage, 3]} castShadow receiveShadow />;
}

function Flag({ y, color }: { y: number; color: string }) {
  const r = useRef<THREE.Mesh>(null);
  useFrame(st => {
    if (r.current) { r.current.rotation.y = st.clock.elapsedTime * 2; r.current.position.y = y + Math.sin(st.clock.elapsedTime * 3) * 0.12; }
  });
  return (
    <mesh ref={r} position={[0, y, 0]} material={mat(color, 0.4)}>
      <octahedronGeometry args={[0.2, 0]} />
    </mesh>
  );
}
