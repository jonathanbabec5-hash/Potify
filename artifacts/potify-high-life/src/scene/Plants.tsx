import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SEEDS } from '@/game/store';
import { useG } from '@/game/runtime';
import { BEDS } from '@/game/world';
import { mat } from '@/scene/materials';

interface BedView { strain: string | null; growth: number; water: number; health: number; fed: boolean }

export function Beds() {
  const plots = useG(s => s.plots.map(p => ({
    strain: p.strain, growth: Math.min(100, Math.floor(p.growth / 4) * 4), water: Math.round(p.water / 10) * 10,
    health: Math.round(p.health / 10) * 10, fed: p.fed,
  })));
  const bigBeds = useG(s => s.upgrades.includes('beds'));
  return (
    <>
      {BEDS.map(b => (
        <Bed key={b.index} x={b.x} z={b.z} big={bigBeds} {...(plots[b.index] ?? { strain: null, growth: 0, water: 0, health: 100, fed: false })} />
      ))}
    </>
  );
}

const Bed = memo(function Bed({ x, z, big, strain, growth, water, health, fed }: BedView & { x: number; z: number; big: boolean }) {
  const soil = useMemo(() => new THREE.Color('#c79a68').lerp(new THREE.Color('#3f2a1f'), water / 100).getStyle(), [water]);
  const seed = SEEDS.find(s => s.id === strain);
  const ready = !!strain && growth >= 100;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]} material={mat(big ? '#1f9e89' : '#f2703f')} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.6, 1.6]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={mat('#fff7e8')}>
        <boxGeometry args={[2.7, 0.08, 1.7]} />
      </mesh>
      <mesh position={[0, 0.63, 0]} material={mat(soil)}>
        <boxGeometry args={[2.35, 0.06, 1.35]} />
      </mesh>
      {fed && [-0.8, 0, 0.8].map(px => (
        <mesh key={px} position={[px, 0.68, 0.45]} material={mat('#8a5a3b')}><icosahedronGeometry args={[0.07, 0]} /></mesh>
      ))}
      {seed && [-0.75, 0, 0.75].map((px, i) => (
        <Plant key={px} x={px} growth={growth} health={health} color={seed.color} ready={ready} offset={i} />
      ))}
      {strain && (ready || water < 30 || health < 40) && (
        <Flag y={growth >= 60 ? 2.6 : 1.7} color={ready ? '#fbd255' : water < 30 ? '#4fb3e8' : '#ef6f7c'} />
      )}
    </group>
  );
});

function Plant({ x, growth, health, color, ready, offset }: { x: number; growth: number; health: number; color: string; ready: boolean; offset: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(st => {
    if (g.current) g.current.rotation.z = Math.sin(st.clock.elapsedTime * 1.3 + offset * 1.7 + x) * 0.05;
  });
  const leaf = useMemo(() => new THREE.Color('#5dbb4a').lerp(new THREE.Color('#d8b04a'), Math.max(0, (60 - health) / 60)).getStyle(), [health]);
  const s = growth < 6 ? 0 : 0.25 + (Math.min(growth, 100) / 100) * 0.85;
  if (growth < 6) {
    return <mesh position={[x, 0.7, 0]} material={mat('#6b4a33')}><icosahedronGeometry args={[0.12, 0]} /></mesh>;
  }
  const tiers = growth < 25 ? 1 : growth < 60 ? 2 : 3;
  return (
    <group ref={g} position={[x, 0.66, 0]} scale={s}>
      <mesh position={[0, 0.6, 0]} material={mat('#4a8a3a')}><cylinderGeometry args={[0.04, 0.06, 1.2, 5]} /></mesh>
      {Array.from({ length: tiers }).map((_, t) => (
        <group key={t} position={[0, 0.35 + t * 0.38, 0]} rotation-y={t * 0.8 + offset}>
          {[0, 1, 2, 3, 4].map(k => (
            <mesh key={k} rotation={[0.9, (k / 5) * Math.PI * 2, 0]} position={[Math.sin((k / 5) * Math.PI * 2) * 0.22, 0, Math.cos((k / 5) * Math.PI * 2) * 0.22]} material={mat(leaf)} castShadow>
              <octahedronGeometry args={[0.2 - t * 0.03, 0]} />
            </mesh>
          ))}
        </group>
      ))}
      {growth >= 60 && (
        <>
          <mesh position={[0, 1.38, 0]} material={ready ? budGlow(color) : mat(color)}><icosahedronGeometry args={[0.2, 0]} /></mesh>
          {[0, 2.1, 4.2].map(a => (
            <mesh key={a} position={[Math.sin(a) * 0.2, 0.95, Math.cos(a) * 0.2]} material={ready ? budGlow(color) : mat(color)}><icosahedronGeometry args={[0.12, 0]} /></mesh>
          ))}
        </>
      )}
    </group>
  );
}

const glowCache = new Map<string, THREE.MeshStandardMaterial>();
function budGlow(c: string) {
  let m = glowCache.get(c);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, flatShading: true }); glowCache.set(c, m); }
  return m;
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
