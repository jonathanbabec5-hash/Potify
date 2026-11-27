import { Matrix4, InstancedMesh } from 'three';
import { SurfaceBlock } from './Surfaces';
import { GrowRoom } from './GrowRoom';
import { WorkshopBench } from './WorkshopBench';
import { SolidSurfaces } from './SolidSurfaces';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useG, useUI } from '@/game/runtime';
import { STORY_POSITIONS } from '@/game/world';
import { glassMat, lampMat, mat, signTex, tileTex, windowMat } from '@/scene/materials';
import { Beds } from '@/scene/Plants';

import { CanalSkyline } from './CanalSkyline';
import { RoofProjects } from './RoofProjects';

function StringLights() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!, transform = new Matrix4();
    let index = 0;
    for (const [x1,z1,x2,z2,count] of [[-6,5.2,6,5.2,11],[-6,11.4,6,11.4,11],[-6,5.2,-6,11.4,6]]) {
      for (let i = 0; i < count; i++) {
        const t = i/(count-1);
        mesh.setMatrixAt(index++, transform.makeTranslation(x1+(x2-x1)*t,2.8-Math.sin(t*Math.PI)*0.5,z1+(z2-z1)*t));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return <instancedMesh ref={ref} args={[undefined, lampMat, 28]}><icosahedronGeometry args={[0.09,0]} /></instancedMesh>;
}

export function Rooftop() {
  const zone = useUI(s => s.zone);
  const aptFloor = useMemo(() => tileTex('#e9c79a', '#ddb788', 4, 3), []);
  useEffect(() => () => { aptFloor.dispose(); }, [aptFloor]);
  const overhead = useG(s => s.settings.camera > 1);
  const inApt = overhead && zone === 'apartment';
  const inGh = overhead && zone === 'greenhouse';
  return (
    <group>
      <group position-y={-86.4} scale={[1.4,2.15,1.4]}><CanalSkyline /></group>
      <RoofProjects />
      {/* building mass */}
      <mesh position={[0, -43.4, 1]} material={mat('#c9bba1')}><boxGeometry args={[25, 86.4, 23]} /></mesh>
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh key={i} position={[0, -3 - i * 3.6, 12.55]} material={windowMat}><boxGeometry args={[20, 1.6, 0.1]} /></mesh>
      ))}
      <SurfaceBlock at={[0,-0.036,1]} size={[24.6,0.07,22.6]} finish="concrete" color="#deccb3" tile={3.2}/>
      {/* parapet */}
      {[[0, -10.2, 25, 0.5], [0, 12.2, 25, 0.5]].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.4, z]} material={mat('#13293a')}><boxGeometry args={[w, 0.8, d]} /></mesh>
      ))}
      {[[-12.3, 1], [12.3, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} material={mat('#13293a')}><boxGeometry args={[0.5, 0.8, 22.9]} /></mesh>
      ))}

      {/* ---------- Apartment (walk-in) ---------- */}
      <group>
        <mesh rotation-x={-Math.PI / 2} position={[-7, 0.02, -5.5]} receiveShadow>
          <planeGeometry args={[7.6, 6.6]} />
          <meshLambertMaterial map={aptFloor} />
        </mesh>
        <mesh position={[-7, 1.3, -8.85]} material={mat('#c4a869')}><boxGeometry args={[8, 2.6, 0.3]} /></mesh>
        <mesh position={[-10.85, 1.3, -5.5]} material={mat('#c4a869')}><boxGeometry args={[0.3, 2.6, 7]} /></mesh>
        <mesh position={[-3.15, 1.3, -5.5]} material={mat('#c4a869')}><boxGeometry args={[0.3, 2.6, 7]} /></mesh>
        <mesh position={[-3.15, 1.4, -5.5]} material={windowMat}><boxGeometry args={[0.34, 0.9, 2]} /></mesh>
        {[-9.5, -4.5].map(x => (
          <mesh key={x} position={[x, inApt ? 0.35 : 1.3, -2.15]} material={mat('#986344')}><boxGeometry args={[3, inApt ? 0.7 : 2.6, 0.3]} /></mesh>
        ))}
        {!inApt && (
          <>
            <mesh position={[-7, 2.35, -2.15]} material={mat('#986344')}><boxGeometry args={[2, 0.5, 0.3]} /></mesh>
            <RoundedBox args={[8.6, 0.5, 7.6]} radius={0.2} smoothness={2} position={[-7, 2.85, -5.5]} material={mat('#13293a')} castShadow />
            <mesh position={[-7, 3.3, -5.5]} material={mat('#886951')}><boxGeometry args={[1, 0.5, 1]} /></mesh>
          </>
        )}
        <mesh position={[-7, 2.0, -1.95]}>
          <planeGeometry args={[2.6, 0.6]} />
          <meshBasicMaterial map={signTex('ROOF LODGE', '#fff7e8', '#13293a', 256, 64)} transparent />
        </mesh>
        {/* furniture */}
        <mesh position={[-9.5, 0.3, -7.8]} material={mat('#90a7a1')} castShadow><boxGeometry args={[2.3, 0.5, 1.7]} /></mesh>
        <mesh position={[-9.5, 0.6, -7.8]} material={mat('#fff7e8')}><boxGeometry args={[2.1, 0.15, 1.5]} /></mesh>
        <mesh position={[-10.2, 0.72, -7.8]} material={mat('#886951')}><boxGeometry args={[0.5, 0.15, 1.2]} /></mesh>
        <mesh position={[-3.85, 1.1, -8.3]} material={mat('#506d58')} castShadow><boxGeometry args={[1, 2.2, 0.7]} /></mesh>
        <mesh position={[-6, 0.4, -8.4]} material={mat('#c7774f')}><boxGeometry args={[1.2, 0.8, 0.6]} /></mesh>
        <mesh position={[-6, 0.98, -8.4]} material={mat('#986344')}><boxGeometry args={[0.7, 0.36, 0.3]} /></mesh>
        <mesh position={[-5.75, 1.0, -8.24]} material={lampMat}><cylinderGeometry args={[0.1, 0.1, 0.02, 10]} /></mesh>
        <group position={[STORY_POSITIONS.lease[0], 0, STORY_POSITIONS.lease[1]]}>
          <mesh position={[0, 0.43, 0]} material={mat('#6c4c37')} castShadow><boxGeometry args={[0.9, 0.86, 0.68]} /></mesh>
          <mesh position={[0, 0.9, 0]} material={mat('#926849')}><boxGeometry args={[0.96, 0.1, 0.74]} /></mesh>
          <mesh position={[0, 0.965, 0.02]} rotation-y={0.22} material={mat('#eed7a9')}><boxGeometry args={[0.58, 0.025, 0.39]} /></mesh>
          <mesh position={[0, 0.99, 0.03]} material={mat('#a55244')}><cylinderGeometry args={[0.065, 0.065, 0.026, 8]} /></mesh>
        </group>
        <group position={[STORY_POSITIONS.signal[0], 0, STORY_POSITIONS.signal[1]]}>
          <mesh position={[0, 0.32, 0]} material={mat('#73503c')} castShadow><boxGeometry args={[0.64, 0.64, 0.58]} /></mesh>
          <mesh position={[0, 0.69, 0]} rotation-y={-0.2} material={mat('#564660')}><boxGeometry args={[0.48, 0.09, 0.38]} /></mesh>
          <mesh position={[0.04, 0.69, 0.17]} material={mat('#f2dfbb')}><boxGeometry args={[0.35, 0.06, 0.05]} /></mesh>
        </group>
        <mesh position={[-7, 0.03, -5]} rotation-x={-Math.PI / 2} material={mat('#886951')}><circleGeometry args={[1.4, 8]} /></mesh>
      </group>

      {/* ---------- Greenhouse (walk-in) ---------- */}
      <group>
        <SurfaceBlock at={[7,0.008,-5.5]} size={[7.6,0.024,6.6]} finish="concrete" tile={2.4}/>
        {[[7, -8.85, 8, 0.3], [3.15, -5.5, 0.3, 7], [10.85, -5.5, 0.3, 7], [4.5, -2.15, 3, 0.3], [9.5, -2.15, 3, 0.3]].map(([x, z, w, d], i) => (
          <group key={i}>
            <mesh position={[x, 0.25, z]} material={mat('#7c8272')}><boxGeometry args={[w, 0.5, d]} /></mesh>
            {!(inGh && i >= 3) && <mesh position={[x, 1.6, z]} material={glassMat}><boxGeometry args={[w, 2.2, d * 0.5]} /></mesh>}
          </group>
        ))}
        {[3.15, 6, 8, 10.85].map(x => [-8.85, -2.15].map(z => (
          <mesh key={`${x}${z}`} position={[x, 1.4, z]} material={mat('#506d58')}><boxGeometry args={[0.16, 2.8, 0.16]} /></mesh>
        )))}
        {!inGh && <mesh position={[7, 2.75, -2.15]} material={mat('#506d58')}><boxGeometry args={[2.2, 0.2, 0.2]} /></mesh>}
        <group position={[STORY_POSITIONS.latch[0], 1.12, STORY_POSITIONS.latch[1]]}>
          <mesh material={mat('#9a6d39', 0.56)}><boxGeometry args={[0.25, 0.28, 0.08]} /></mesh>
          <mesh position={[-0.03, 0.025, 0.06]} rotation-z={Math.PI / 2} material={mat('#e8b35c', 0.42)}><cylinderGeometry args={[0.055, 0.055, 0.33, 8]} /></mesh>
          <mesh position={[-0.205, 0.025, 0.06]} material={mat('#e8b35c', 0.42)}><torusGeometry args={[0.07, 0.018, 5, 10]} /></mesh>
        </group>
        <GrowRoom glazing={!inGh}/>
        <WorkshopBench />
        <mesh position={[3.45, 1.3, -4.6]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[1.4, 1.0]} />
          <meshStandardMaterial map={signTex('PLANNER', '#c4a869', '#13293a', 256, 128)} />
        </mesh>
        {!inGh && <mesh position={[7, 2.6, -1.95]}>
          <planeGeometry args={[2.4, 0.5]} />
          <meshBasicMaterial map={signTex('GREENHOUSE', '#506d58', '#fff7e8', 384, 80)} transparent />
        </mesh>}
      </group>

      <Beds />
      {/* bed-area light poles + string lights */}
      {[[-6, 5.2], [6, 5.2], [-6, 11.4], [6, 11.4]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 1.4, z]} material={mat('#13293a')}><cylinderGeometry args={[0.07, 0.07, 2.8, 5]} /></mesh>
      ))}
      <StringLights />

      {/* stair hut */}
      <RoundedBox args={[3.2, 3, 3.6]} radius={0.25} smoothness={2} position={[10.2, 1.5, 10]} material={mat('#506d58')} castShadow />
      <mesh position={[10.2, 3.15, 10]} material={mat('#c4a869')}><boxGeometry args={[3.5, 0.3, 3.9]} /></mesh>
      <mesh position={[8.58, 1.1, 9.9]} material={mat('#13293a')}><boxGeometry args={[0.1, 2.2, 1.3]} /></mesh>
      <mesh position={[8.55, 1.1, 10.4]} material={mat('#c4a869')}><icosahedronGeometry args={[0.07, 0]} /></mesh>
      <mesh position={[8.5, 2.55, 9.9]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.8, 0.45]} />
        <meshBasicMaterial map={signTex('STAIR 24', '#fff7e8', '#13293a', 256, 64)} transparent />
      </mesh>

      {/* water tank, bench, pots, antenna */}
      <SolidSurfaces>
      <mesh position={[-10.6, 1.6, 4.2]} material={mat('#90a7a1')} castShadow><cylinderGeometry args={[1.1, 1.1, 2.2, 8]} /></mesh>
      <mesh position={[-10.6, 2.9, 4.2]} material={mat('#13293a')}><coneGeometry args={[1.2, 0.5, 8]} /></mesh>
      {[[-11.5, 3.3], [-9.7, 3.3], [-11.5, 5.1], [-9.7, 5.1]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.3, z]} material={mat('#13293a')}><boxGeometry args={[0.15, 0.6, 0.15]} /></mesh>
      ))}
      <mesh position={[-9, 0.45, 9.8]} material={mat('#886951')} castShadow><boxGeometry args={[3, 0.25, 1]} /></mesh>
      <mesh position={[-9, 0.85, 10.25]} material={mat('#886951')}><boxGeometry args={[3, 0.6, 0.15]} /></mesh>
      {[[-11.6, -0.8], [-11.6, 7.4], [11.6, 0], [11.6, 3.6], [-1.5, -9.6], [1.5, -9.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} material={mat(['#986344', '#506d58', '#c4a869'][i % 3])}><cylinderGeometry args={[0.35, 0.25, 0.6, 7]} /></mesh>
          <mesh position={[0, 0.9, 0]} material={mat('#65904a')}><icosahedronGeometry args={[0.45, 0]} /></mesh>
        </group>
      ))}
      <group position={[0, 0, -9.4]}>
        <mesh position={[0, 2, 0]} material={mat('#13293a')}><cylinderGeometry args={[0.08, 0.1, 4, 5]} /></mesh>
        <mesh position={[0, 4.1, 0]} material={lampMat}><icosahedronGeometry args={[0.18, 0]} /></mesh>
      </group>
      </SolidSurfaces>
    </group>
  );
}
