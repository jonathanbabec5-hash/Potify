import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mat } from '@/scene/materials';

export type Variant = 'player' | 'mira' | 'moss' | 'jun';

interface Props {
  shirt: string;
  skin: string;
  hair: string;
  variant: Variant;
  speed: MutableRefObject<number>;
}

/** Original chunky low-poly figure: big round head, short body, stubby limbs. */
export function Character({ shirt, skin, hair, variant, speed }: Props) {
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * 10);

  useFrame((st, dt) => {
    const s = speed.current;
    const amt = Math.min(1, s / 4);
    phase.current += dt * (4 + s * 2.2);
    const sw = Math.sin(phase.current) * 0.7 * amt;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
    if (armL.current) armL.current.rotation.x = -sw * 0.9;
    if (armR.current) armR.current.rotation.x = sw * 0.9;
    if (body.current) {
      const idle = Math.sin(st.clock.elapsedTime * 2.2) * 0.02;
      body.current.position.y = Math.abs(Math.sin(phase.current)) * 0.09 * amt + idle;
    }
  });

  const pants = variant === 'moss' ? '#5b4a3a' : variant === 'jun' ? '#2b3a4f' : variant === 'mira' ? '#f4e2c4' : '#2f4a5c';
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.45, 12]} />
        <meshBasicMaterial color="#13293a" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={body}>
        {[legL, legR].map((r, i) => (
          <group key={i} ref={r} position={[i ? 0.14 : -0.14, 0.52, 0]}>
            <mesh position={[0, -0.24, 0]} material={mat(pants)} castShadow>
              <boxGeometry args={[0.18, 0.46, 0.2]} />
            </mesh>
            <mesh position={[0, -0.47, 0.05]} material={mat('#13293a')}>
              <boxGeometry args={[0.2, 0.1, 0.3]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.82, 0]} material={mat(shirt)} castShadow>
          <cylinderGeometry args={[0.28, variant === 'moss' ? 0.42 : 0.34, 0.66, 7]} />
        </mesh>
        {[armL, armR].map((r, i) => (
          <group key={i} ref={r} position={[i ? 0.38 : -0.38, 1.06, 0]}>
            <mesh position={[0, -0.2, 0]} material={mat(shirt)}>
              <boxGeometry args={[0.14, 0.42, 0.16]} />
            </mesh>
            <mesh position={[0, -0.45, 0]} material={mat(skin)}>
              <icosahedronGeometry args={[0.09, 0]} />
            </mesh>
          </group>
        ))}
        <group position={[0, 1.5, 0]}>
          <mesh material={mat(skin)} castShadow>
            <icosahedronGeometry args={[0.36, 1]} />
          </mesh>
          {[-0.12, 0.12].map(x => (
            <mesh key={x} position={[x, 0.03, 0.32]} material={mat('#13293a')}>
              <boxGeometry args={[0.06, 0.1, 0.04]} />
            </mesh>
          ))}
          <mesh position={[0, -0.12, 0.33]} material={mat('#e5806a')}>
            <boxGeometry args={[0.1, 0.03, 0.03]} />
          </mesh>
          {variant === 'player' && (
            <group position={[0, 0.2, 0]}>
              <mesh material={mat(hair)}><cylinderGeometry args={[0.3, 0.36, 0.22, 8]} /></mesh>
              <mesh position={[0, -0.1, 0.08]} material={mat(hair)}><cylinderGeometry args={[0.5, 0.5, 0.04, 10]} /></mesh>
            </group>
          )}
          {variant === 'mira' && (
            <>
              <mesh position={[0, 0.24, -0.02]} material={mat('#fbd255')}><coneGeometry args={[0.36, 0.42, 7]} /></mesh>
              <mesh position={[0, 0.48, -0.02]} material={mat('#fff7e8')}><icosahedronGeometry args={[0.08, 0]} /></mesh>
              {[-0.13, 0.13].map(x => (
                <mesh key={x} position={[x, 0.03, 0.34]} material={mat('#13293a')}><torusGeometry args={[0.08, 0.018, 4, 10]} /></mesh>
              ))}
              <mesh position={[0, -0.18, -0.25]} material={mat(hair)}><boxGeometry args={[0.5, 0.5, 0.18]} /></mesh>
            </>
          )}
          {variant === 'moss' && (
            <>
              <mesh position={[0, -0.24, 0.2]} material={mat(hair)}><boxGeometry args={[0.46, 0.3, 0.2]} /></mesh>
              <mesh position={[0, 0.28, 0]} material={mat('#e8c76a')}><cylinderGeometry args={[0.6, 0.6, 0.05, 9]} /></mesh>
              <mesh position={[0, 0.36, 0]} material={mat('#e8c76a')}><cylinderGeometry args={[0.26, 0.3, 0.18, 9]} /></mesh>
            </>
          )}
          {variant === 'jun' && (
            <>
              <mesh position={[0, 0.3, 0.05]} rotation-x={-0.3} material={mat(hair)}><boxGeometry args={[0.42, 0.28, 0.5]} /></mesh>
              <mesh rotation-y={Math.PI / 2} material={mat('#fbd255')}><torusGeometry args={[0.39, 0.04, 5, 12, Math.PI]} /></mesh>
              {[-0.38, 0.38].map(x => (
                <mesh key={x} position={[x, 0, 0]} rotation-z={Math.PI / 2} material={mat('#13293a')}><cylinderGeometry args={[0.12, 0.12, 0.1, 8]} /></mesh>
              ))}
            </>
          )}
        </group>
      </group>
    </group>
  );
}
