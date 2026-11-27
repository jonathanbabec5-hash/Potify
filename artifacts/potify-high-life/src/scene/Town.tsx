import { SurfaceBlock } from './Surfaces';
import { SolidSurfaces } from './SolidSurfaces';
import { useG } from '@/game/runtime';
import { houseDate } from '@/game/house';
import { Suspense, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import packetUrl from '@/assets/lore/seed-and-signal/mira-packet.glb?url';
import { Warehouse } from './Warehouse';
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
      <SurfaceBlock at={[0,h/2,0]} size={[w,h,d]} finish="brick" color={id==='lab'?'#d3ccc3':'#e0d4bd'} tile={2.2} />
      {id === 'lab' ? (
        <mesh position={[0, h, 0]} material={mat(s.roof)}><sphereGeometry args={[2.6, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      ) : (
        <mesh position={[0, h + 0.7, 0]} rotation-y={Math.PI / 4} material={mat(s.roof)} castShadow>
          <coneGeometry args={[Math.max(w, d) * 0.72, 1.6, 4]} />
        </mesh>
      )}
      <SolidSurfaces>
      {/* door + awning */}
      <mesh position={[0, 1.1, d / 2 + 0.02]} material={mat('#13293a')}><boxGeometry args={[1.4, 2.2, 0.1]} /></mesh>
      <mesh position={[0.45, 1.1, d / 2 + 0.1]} material={lampMat}><icosahedronGeometry args={[0.07, 0]} /></mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (w / 2 - 1.3), 1.6, d / 2 + 0.03]} material={windowMat}><boxGeometry args={[1.5, 1.2, 0.08]} /></mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + 0.5 + (i * (w - 1)) / 5, 2.75, d / 2 + 0.5]} rotation-x={0.5} material={mat(i % 2 ? '#fff7e8' : s.roof === '#fff7e8' ? '#506d58' : s.roof)}>
          <boxGeometry args={[(w - 1) / 5 + 0.02, 0.08, 1.1]} />
        </mesh>
      ))}
      <mesh position={[0, 3.6, d / 2 + 0.05]}>
        <planeGeometry args={[w * 0.85, 0.85]} />
        <meshBasicMaterial map={signTex(s.name.toUpperCase(), '#fff7e8', '#13293a')} transparent />
      </mesh>
      </SolidSurfaces>
      {id === 'seed' && <>
        <SignalMast h={h} />
        <group name="SeedAndSignalCounter" position={[1.85, 1.04, d / 2 + 0.16]}>
          <SolidSurfaces>
            <SurfaceBlock at={[0, 0, 0]} size={[1.04, 0.08, 0.34]} finish="cedar" />
            {[-0.35, 0.35].map(x => <mesh key={x} position={[x, -0.13, -0.12]} rotation-x={-0.55} material={mat('#605849')}>
              <boxGeometry args={[0.06, 0.31, 0.08]} />
            </mesh>)}
          </SolidSurfaces>
          <group position={[0, 0.294, 0]} rotation={[1.055, 0, -0.045]}>
            <SurfaceBlock at={[0, -0.012, 0]} size={[0.44, 0.024, 0.565]} finish="cedar" color="#687360" />
            <SurfaceBlock at={[0, 0.009, 0.274]} size={[0.44, 0.034, 0.026]} finish="cedar" />
            <Suspense fallback={null}><CounterPacket /></Suspense>
          </group>
        </group>
      </>}
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
          <mesh position={[0.45, 0.66, 0.421]} rotation-z={-0.14} material={mat('#f1dbab')}><boxGeometry args={[0.24, 0.33, 0.04]} /></mesh>
          <mesh position={[0.44, 0.82, 0.45]} material={mat('#6c4c37')}><torusGeometry args={[0.04, 0.012, 4, 8]} /></mesh>
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={x} position={[x, 1.15, 0]} material={mat(['#a6ce56', '#9dbce8', '#e7b65f'][i])}><icosahedronGeometry args={[0.2, 0]} /></mesh>
          ))}
        </group>
      )}
      {id === 'cafe' && (
        <>
          <CafeDeliveryShelf x={w / 2 - 1.25} z={d / 2 + .19} />
          {[-2.6, 2.6].map(x => (
            <group key={x} position={[x, 0, d / 2 + 0.8]}>
              <mesh position={[0, 0.7, 0]} material={mat('#13293a')}><boxGeometry args={[0.8, 1.4, 0.6]} /></mesh>
              <mesh position={[0, 0.95, 0.31]} rotation-x={Math.PI / 2} material={mat('#c4a869')}><cylinderGeometry args={[0.25, 0.25, 0.02, 10]} /></mesh>
              <mesh position={[0, 0.45, 0.31]} rotation-x={Math.PI / 2} material={mat('#c4a869')}><cylinderGeometry args={[0.15, 0.15, 0.02, 10]} /></mesh>
            </group>
          ))}
        </>
      )}
      {id === 'lab' && (
        <mesh position={[-1.5, h + 1.8, 0]} material={mat('#886951')}><torusGeometry args={[0.4, 0.1, 5, 10]} /></mesh>
      )}
    </group>
  );
}

function CounterPacket() {
  const asset = useLoader(GLTFLoader, packetUrl);
  return <primitive object={asset.scene} scale={3.35} dispose={null} />;
}

function CafeDeliveryShelf({ x, z }: { x: number; z: number }) {
  const cartFirst = useG(s => s.projects[0] === 'cart');
  if (!cartFirst) return null;
  return <group name="JunDeliveryShelf" position={[x, .96, z]}>
    <SolidSurfaces>
      <SurfaceBlock at={[0, 0, 0]} size={[1.66, .12, .47]} finish="cedar" />
      {[-.55, .55].map(side => <mesh key={side} position={[side, -.18, -.05]} rotation-x={-.5} material={mat('#555747')}>
        <boxGeometry args={[.07, .40, .08]} />
      </mesh>)}
    </SolidSurfaces>
    <mesh position={[.35, .18, -.08]}>
      <planeGeometry args={[.53, .25]} />
      <meshBasicMaterial map={signTex('7B', '#e4cea4', '#394638', 128, 64)} />
    </mesh>
  </group>;
}

function SignalMast({ h }: { h: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(st => { if (m.current) m.current.scale.setScalar(0.8 + Math.abs(Math.sin(st.clock.elapsedTime * 3)) * 0.6); });
  return (
    <group position={[2.5, h, -1]}>
      <mesh position={[0, 1.6, 0]} material={mat('#13293a')}><cylinderGeometry args={[0.06, 0.12, 3.2, 4]} /></mesh>
      <mesh position={[0, 2.3, 0]} rotation-x={Math.PI / 2} material={mat('#fff7e8')}><torusGeometry args={[0.4, 0.05, 4, 10]} /></mesh>
      <mesh ref={m} position={[0, 3.3, 0]} material={mat('#886951', 0.3)}><icosahedronGeometry args={[0.16, 0]} /></mesh>
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
      <mesh position={[0, 1.2, 0]} material={mat('#986344')}><cylinderGeometry args={[0.3, 0.45, 1.1, 7]} /></mesh>
      <mesh ref={w} position={[0, 2.1, 0]} material={mat('#90a7a1', 0.2)}><coneGeometry args={[0.5, 0.9, 7]} /></mesh>
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
  const season = useG(s=>houseDate(s.day).index);
  const paving = useMemo(() => tileTex('#f6d9b2', '#efcca0', 8, 10), []);
  const backdrop = useMemo(() => {
    const r = seeded(31);
    const cs = ['#986344', '#c4a869', '#506d58', '#886951', '#90a7a1', '#f6a46b'];
    return Array.from({ length: 34 }).map((_, i) => {
      const side = i % 4;
      const t = r();
      const x = side < 2 ? 58 + t * 44 : side === 2 ? 56 : 126;
      const z = side === 0 ? -22 - r() * 6 : side === 1 ? 22 + r() * 6 : -20 + t * 40;
      return { x, z, h: 5 + r() * 12, w: 4 + r() * 4, c: cs[Math.floor(r() * cs.length)] };
    });
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[80, 0, 0]} receiveShadow>
        <planeGeometry args={[86, 52]} />
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
        <mesh position={[0, 43.2, 0.5]} material={mat('#c9bba1')} castShadow><boxGeometry args={[8, 86.4, 5]} /></mesh>
        <mesh position={[0, 1.2, -2.03]} material={mat('#506d58')}><boxGeometry args={[1.6, 2.4, 0.1]} /></mesh>
        <mesh position={[0, 2.9, -2.1]} rotation-y={Math.PI}>
          <planeGeometry args={[3.4, 0.7]} />
          <meshBasicMaterial map={signTex('CANOPY HOUSE', '#c4a869', '#13293a')} transparent side={THREE.DoubleSide} />
        </mesh>
        {Array.from({length:24},(_,i)=>2.7+i*3.6).map(y => (
          <mesh key={y} position={[0, y, -2.03]} material={windowMat}><boxGeometry args={[6, 1.4, 0.06]} /></mesh>
        ))}
      </group>
      <Warehouse />
      <Fountain />
      <SolidSurfaces revision={String(season)}>
      {TOWN_TREES.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]} material={mat('#8a5a3b')}><cylinderGeometry args={[0.15, 0.22, 1.8, 5]} /></mesh>
          <mesh position={[0, 2.4, 0]} material={mat(['#9baa74','#6c8866','#c18a58','#b4b6a8'][season])} castShadow><icosahedronGeometry args={[1.2, 0]} /></mesh>
          <mesh position={[0.3, 3.2, 0.1]} material={mat('#886951')}><icosahedronGeometry args={[0.7, 0]} /></mesh>
        </group>
      ))}
      {[[75.5, 4.7], [84.5, 4.7]].map(([x, z]) => (
        <mesh key={x} position={[x, 0.4, z]} material={mat('#506d58')}><boxGeometry args={[2, 0.2, 0.8]} /></mesh>
      ))}
      <group position={[84, 0, -3.9]}>
        <mesh position={[-0.35, 0.8, 0]} material={mat('#13293a')}><boxGeometry args={[0.1, 1.6, 0.1]} /></mesh>
        <mesh position={[0.35, 0.8, 0]} material={mat('#13293a')}><boxGeometry args={[0.1, 1.6, 0.1]} /></mesh>
        <mesh position={[0, 1.5, 0.06]}>
          <planeGeometry args={[1.3, 0.9]} />
          <meshStandardMaterial color="#a78558" />
        </mesh>
        <mesh position={[0, 1.79, 0.07]}>
          <planeGeometry args={[1.24, 0.26]} />
          <meshBasicMaterial map={signTex('QUARTER NOTICES', '#485a44', '#f6e8ce', 384, 80)} />
        </mesh>
        {[-0.39, 0, 0.38].map((x, i) => (
          <mesh key={x} position={[x, 1.45 - i * 0.045, 0.08]} rotation-z={0.06 - i * 0.05}>
            <planeGeometry args={[0.28, 0.34]} /><meshStandardMaterial color={i === 1 ? '#d4bd82' : '#f1e6ce'} />
          </mesh>
        ))}
      </group>
      {[[66, -1], [94, -1], [74, 10], [86, 10], [74, -6], [86, -6]].map(([x, z]) => <Lamp key={`${x}${z}`} x={x} z={z} />)}
      </SolidSurfaces>
    </group>
  );
}
