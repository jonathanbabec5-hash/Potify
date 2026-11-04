import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { SHOPS, TOWN_TREES } from '@/game/world';
import { lampMat, mat, seeded, signTex, tileTex, windowMat } from '@/scene/materials';

type ShopKey = keyof typeof SHOPS;

function Shop({ id }: { id: ShopKey }) {
  const s = SHOPS[id];
  const facesEast = id === 'lab';
  const facesWest = id === 'cafe';
  const rotY = facesEast ? Math.PI / 2 : facesWest ? -Math.PI / 2 : 0;
  const w = facesEast || facesWest ? s.d : s.w; // local width (front face)
  const d = facesEast || facesWest ? s.w : s.d;
  const h = id === 'lab' ? 4 : 4.6;
  return (
    <group position={[s.x, 0, s.z]} rotation-y={rotY}>
      <RoundedBox args={[w, h, d]} radius={0.3} smoothness={2} position={[0, h / 2, 0]} material={mat(s.color)} castShadow receiveShadow />
      {id === 'lab' ? (
        <mesh position={[0, h, 0]} material={mat(s.roof)}><sphereGeometry args={[2.6, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      ) : (
        <mesh position={[0, h + 0.7, 0]} rotation-y={Math.PI / 4} material={mat(s.roof)} castShadow>
          <coneGeometry args={[Math.max(w, d) * 0.72, 1.6, 4]} />
        </mesh>
      )}
      {/* door + awning */}
      <mesh position={[0, 1.1, d / 2 + 0.02]} material={mat('#13293a')}><boxGeometry args={[1.4, 2.2, 0.1]} /></mesh>
      <mesh position={[0.45, 1.1, d / 2 + 0.1]} material={lampMat}><icosahedronGeometry args={[0.07, 0]} /></mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (w / 2 - 1.3), 1.6, d / 2 + 0.03]} material={windowMat}><boxGeometry args={[1.5, 1.2, 0.08]} /></mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + 0.5 + (i * (w - 1)) / 5, 2.75, d / 2 + 0.5]} rotation-x={0.5} material={mat(i % 2 ? '#fff7e8' : s.roof === '#fff7e8' ? '#1f9e89' : s.roof)}>
          <boxGeometry args={[(w - 1) / 5 + 0.02, 0.08, 1.1]} />
        </mesh>
      ))}
      <mesh position={[0, 3.6, d / 2 + 0.05]}>
        <planeGeometry args={[w * 0.85, 0.85]} />
        <meshBasicMaterial map={signTex(s.name.toUpperCase(), '#fff7e8', '#13293a')} transparent />
      </mesh>
      {id === 'seed' && <SignalMast h={h} />}
      {id === 'rootworks' && (
        <>
          <mesh position={[w / 2 - 1, h + 1.2, -1]} material={mat('#c7774f')}><boxGeometry args={[0.7, 2, 0.7]} /></mesh>
          {[-2.4, -1.7, 2.2].map((x, i) => (
            <mesh key={i} position={[x, 0.35, d / 2 + 0.9]} material={mat('#b98a5a')}><boxGeometry args={[0.6, 0.7, 0.45]} /></mesh>
          ))}
        </>
      )}
      {id === 'exchange' && (
        <group position={[2.6, 0, d / 2 + 1.2]}>
          <mesh position={[0, 0.5, 0]} material={mat('#c7774f')}><boxGeometry args={[1.6, 1, 0.8]} /></mesh>
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={x} position={[x, 1.15, 0]} material={mat(['#a6ce56', '#9dbce8', '#e7b65f'][i])}><icosahedronGeometry args={[0.2, 0]} /></mesh>
          ))}
        </group>
      )}
      {id === 'cafe' && (
        <>
          {[-2.6, 2.6].map(x => (
            <group key={x} position={[x, 0, d / 2 + 0.8]}>
              <mesh position={[0, 0.7, 0]} material={mat('#13293a')}><boxGeometry args={[0.8, 1.4, 0.6]} /></mesh>
              <mesh position={[0, 0.95, 0.31]} rotation-x={Math.PI / 2} material={mat('#fbd255')}><cylinderGeometry args={[0.25, 0.25, 0.02, 10]} /></mesh>
              <mesh position={[0, 0.45, 0.31]} rotation-x={Math.PI / 2} material={mat('#fbd255')}><cylinderGeometry args={[0.15, 0.15, 0.02, 10]} /></mesh>
            </group>
          ))}
        </>
      )}
      {id === 'lab' && (
        <mesh position={[-1.5, h + 1.8, 0]} material={mat('#ef6f7c')}><torusGeometry args={[0.4, 0.1, 5, 10]} /></mesh>
      )}
    </group>
  );
}

function SignalMast({ h }: { h: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(st => { if (m.current) m.current.scale.setScalar(0.8 + Math.abs(Math.sin(st.clock.elapsedTime * 3)) * 0.6); });
  return (
    <group position={[2.5, h, -1]}>
      <mesh position={[0, 1.6, 0]} material={mat('#13293a')}><cylinderGeometry args={[0.06, 0.12, 3.2, 4]} /></mesh>
      <mesh position={[0, 2.3, 0]} rotation-x={Math.PI / 2} material={mat('#fff7e8')}><torusGeometry args={[0.4, 0.05, 4, 10]} /></mesh>
      <mesh ref={m} position={[0, 3.3, 0]} material={mat('#ef6f7c', 0.3)}><icosahedronGeometry args={[0.16, 0]} /></mesh>
    </group>
  );
}

function Fountain() {
  const w = useRef<THREE.Mesh>(null);
  useFrame(st => { if (w.current) w.current.scale.y = 1 + Math.sin(st.clock.elapsedTime * 4) * 0.15; });
  return (
    <group position={[80, 0, 0]}>
      <mesh position={[0, 0.35, 0]} material={mat('#fff7e8')}><cylinderGeometry args={[2.1, 2.3, 0.7, 10]} /></mesh>
      <mesh position={[0, 0.66, 0]} material={mat('#4fb3e8', 0.2)}><cylinderGeometry args={[1.8, 1.8, 0.05, 10]} /></mesh>
      <mesh position={[0, 1.2, 0]} material={mat('#f2703f')}><cylinderGeometry args={[0.3, 0.45, 1.1, 7]} /></mesh>
      <mesh ref={w} position={[0, 2.1, 0]} material={mat('#8fd6e2', 0.2)}><coneGeometry args={[0.5, 0.9, 7]} /></mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]} material={mat('#13293a')}><cylinderGeometry args={[0.07, 0.1, 3, 5]} /></mesh>
      <mesh position={[0, 3.1, 0]} material={lampMat}><icosahedronGeometry args={[0.25, 0]} /></mesh>
    </group>
  );
}

export function Town() {
  const paving = useMemo(() => tileTex('#f6d9b2', '#efcca0', 8, 10), []);
  const backdrop = useMemo(() => {
    const r = seeded(31);
    const cs = ['#f2703f', '#fbd255', '#1f9e89', '#ef6f7c', '#8fd6e2', '#f6a46b'];
    return Array.from({ length: 34 }).map((_, i) => {
      const side = i % 4;
      const t = r();
      const x = side < 2 ? 58 + t * 44 : side === 2 ? 56 : 104;
      const z = side === 0 ? -22 - r() * 6 : side === 1 ? 22 + r() * 6 : -20 + t * 40;
      return { x, z, h: 5 + r() * 12, w: 4 + r() * 4, c: cs[Math.floor(r() * cs.length)] };
    });
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[80, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 52]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[80, -0.05, 0]} material={mat('#7cb36a')}>
        <planeGeometry args={[220, 220]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[80, 0.02, 0]} material={mat('#e6a983')}>
        <ringGeometry args={[3, 6.5, 16]} />
      </mesh>
      {backdrop.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh material={mat(b.c)}><boxGeometry args={[b.w, b.h, b.w]} /></mesh>
          <mesh position={[0, 0, b.w / 2 + 0.02]} material={windowMat}><boxGeometry args={[b.w * 0.6, b.h * 0.6, 0.05]} /></mesh>
        </group>
      ))}
      {(Object.keys(SHOPS) as ShopKey[]).map(id => <Shop key={id} id={id} />)}
      {/* your building, with stair door back to the roof */}
      <group position={[80, 0, 17]}>
        <mesh position={[0, 9, 0.5]} material={mat('#fff1d6')} castShadow><boxGeometry args={[8, 18, 5]} /></mesh>
        <mesh position={[0, 1.2, -2.03]} material={mat('#1f9e89')}><boxGeometry args={[1.6, 2.4, 0.1]} /></mesh>
        <mesh position={[0, 2.9, -2.1]} rotation-y={Math.PI}>
          <planeGeometry args={[3.4, 0.7]} />
          <meshBasicMaterial map={signTex('HOME  ROOF ACCESS', '#fbd255', '#13293a')} transparent side={THREE.DoubleSide} />
        </mesh>
        {[5, 8.5, 12, 15.5].map(y => (
          <mesh key={y} position={[0, y, -2.03]} material={windowMat}><boxGeometry args={[6, 1.4, 0.06]} /></mesh>
        ))}
      </group>
      <Fountain />
      {TOWN_TREES.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]} material={mat('#8a5a3b')}><cylinderGeometry args={[0.15, 0.22, 1.8, 5]} /></mesh>
          <mesh position={[0, 2.4, 0]} material={mat('#f6a46b')} castShadow><icosahedronGeometry args={[1.2, 0]} /></mesh>
          <mesh position={[0.3, 3.2, 0.1]} material={mat('#ef6f7c')}><icosahedronGeometry args={[0.7, 0]} /></mesh>
        </group>
      ))}
      {[[75.5, 4.7], [84.5, 4.7]].map(([x, z]) => (
        <mesh key={x} position={[x, 0.4, z]} material={mat('#1f9e89')}><boxGeometry args={[2, 0.2, 0.8]} /></mesh>
      ))}
      <group position={[84, 0, -3.9]}>
        <mesh position={[-0.35, 0.8, 0]} material={mat('#13293a')}><boxGeometry args={[0.1, 1.6, 0.1]} /></mesh>
        <mesh position={[0.35, 0.8, 0]} material={mat('#13293a')}><boxGeometry args={[0.1, 1.6, 0.1]} /></mesh>
        <mesh position={[0, 1.5, 0.06]}>
          <planeGeometry args={[1.3, 0.9]} />
          <meshStandardMaterial map={signTex('TOWN BOARD', '#fbd255', '#13293a', 256, 160)} />
        </mesh>
      </group>
      {[[66, -1], [94, -1], [74, 10], [86, 10], [74, -6], [86, -6]].map(([x, z]) => <Lamp key={`${x}${z}`} x={x} z={z} />)}
    </group>
  );
}
