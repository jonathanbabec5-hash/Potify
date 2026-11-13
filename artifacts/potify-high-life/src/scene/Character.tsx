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

const WORKWEAR = {
  player: { trousers: '#3d5040', boot: '#3c302b', trim: '#5e694b' },
  mira: { trousers: '#6c5948', boot: '#443442', trim: '#56445f' },
  moss: { trousers: '#51483a', boot: '#382d28', trim: '#716244' },
  jun: { trousers: '#41485a', boot: '#393043', trim: '#4d5b5f' },
};

/** Low-poly figures with readable silhouettes at the gameplay camera distance. */
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

  const clothes = WORKWEAR[variant];
  const player = variant === 'player';
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.45, 12]} />
        <meshBasicMaterial color="#13293a" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={body}>
        {[legL, legR].map((r, i) => (
          <group key={i} ref={r} position={[i ? 0.15 : -0.15, 0.59, 0]}>
            <mesh position={[0, -0.21, 0]} material={mat(clothes.trousers)} castShadow>
              <boxGeometry args={[0.21, 0.46, 0.23]} />
            </mesh>
            <mesh position={[0, -0.47, 0.035]} material={mat(clothes.boot)}>
              <boxGeometry args={[0.24, 0.19, 0.32]} />
            </mesh>
            <mesh position={[0, -0.553, 0.06]} material={mat('#332b28')}>
              <boxGeometry args={[0.25, 0.058, 0.35]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.87, 0]} scale={[1, 1, 0.76]} material={mat(shirt)} castShadow>
          <cylinderGeometry args={[0.34, variant === 'moss' ? 0.4 : 0.32, 0.62, 8]} />
        </mesh>
        <mesh position={[0, 0.65, 0]} scale={[1, 1, 0.76]} material={mat(clothes.trousers)}>
          <cylinderGeometry args={[0.33, 0.31, 0.19, 8]} />
        </mesh>
        {(player || variant === 'moss' || variant === 'jun') && (
          <group position={[0, 0.85, 0.249]}>
            <mesh material={mat(clothes.trim)}><boxGeometry args={[0.35, 0.36, 0.055]} /></mesh>
            {[-1, 1].map(side => (
              <group key={side} position={[side * 0.128, 0.14, 0.002]}>
                <mesh position={[0, 0.105, -0.012]} rotation-x={-0.29} material={mat(clothes.trim)}><boxGeometry args={[0.077, 0.31, 0.052]} /></mesh>
                <mesh position={[0, 0, 0.037]} rotation-x={Math.PI / 2} material={mat('#c2975e', 0.54)}><cylinderGeometry args={[0.033, 0.033, 0.026, 8]} /></mesh>
              </group>
            ))}
            <mesh position={[0, -0.055, 0.04]} material={mat(clothes.trousers)}><boxGeometry args={[0.15, 0.105, 0.021]} /></mesh>
          </group>
        )}
        {variant === 'mira' && (
          <group position={[0, 1.13, 0.1]}>
            <mesh scale={[1, 1, 0.68]} material={mat('#c09474')}><cylinderGeometry args={[0.29, 0.31, 0.13, 8]} /></mesh>
            <mesh position={[0.13, -0.11, 0.159]} rotation-z={-0.35} material={mat('#c09474')}><boxGeometry args={[0.17, 0.31, 0.06]} /></mesh>
          </group>
        )}
        {[armL, armR].map((r, i) => (
          <group key={i} ref={r} position={[i ? 0.38 : -0.38, 1.1, 0]} rotation-z={i ? 0.15 : -0.15}>
            <mesh position={[0, -0.145, 0]} material={mat(shirt)}>
              <cylinderGeometry args={[0.105, 0.092, 0.33, 6]} />
            </mesh>
            <mesh position={[0, -0.31, 0]} material={mat(clothes.trim)}>
              <cylinderGeometry args={[0.099, 0.099, 0.072, 6]} />
            </mesh>
            <mesh position={[0, -0.404, 0.006]} scale={[0.82, 1.34, 0.91]} material={mat(skin)}>
              <icosahedronGeometry args={[0.114, 0]} />
            </mesh>
          </group>
        ))}
        <group position={[0, 1.55, 0]}>
          <mesh scale={[1.1, 1, 0.91]} material={mat(skin)} castShadow>
            <icosahedronGeometry args={[0.377, 1]} />
          </mesh>
          {[-1, 1].map(side => (
            <group key={side}>
              <mesh position={[side * 0.365, -0.055, 0.02]} scale={[0.68, 1, 0.83]} material={mat(skin)}>
                <icosahedronGeometry args={[0.097, 0]} />
              </mesh>
              <mesh position={[side * 0.124, 0.025, 0.326]} rotation-y={side * 0.17} material={mat('#2d2530')}>
                <boxGeometry args={[0.077, 0.105, 0.033]} />
              </mesh>
              <mesh position={[side * 0.124 - 0.018, 0.049, 0.349]} material={mat('#f5e7cb')}>
                <boxGeometry args={[0.024, 0.025, 0.01]} />
              </mesh>
              <mesh position={[side * 0.12, 0.115, 0.323]} rotation-z={side * -0.16} material={mat(hair)}>
                <boxGeometry args={[0.114, 0.024, 0.029]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.052, 0.341]} scale={[0.75, 0.69, 0.63]} material={mat(skin)}>
            <icosahedronGeometry args={[0.084, 0]} />
          </mesh>
          {variant !== 'moss' && (
            <mesh position={[0, -0.145, 0.318]} rotation-x={-0.26} material={mat('#8f4d4b')}>
              <boxGeometry args={[0.094, 0.023, 0.02]} />
            </mesh>
          )}
          {player && (
            <group>
              <mesh position={[0, 0.09, -0.115]} scale={[1.05, 0.95, 0.86]} material={mat(hair)}><icosahedronGeometry args={[0.375, 1]} /></mesh>
              {[-0.23, -0.09, 0.075, 0.21].map((x, i) => (
                <mesh key={x} position={[x, 0.17, 0.25]} rotation-z={-0.3 - i * 0.09} rotation-x={0.23} material={mat(hair)}>
                  <boxGeometry args={[0.12, 0.29 - i * 0.02, 0.155]} />
                </mesh>
              ))}
              <mesh position={[0, 0.3, -0.035]} scale={[1.14, 1, 0.89]} material={mat('#57533b')}><cylinderGeometry args={[0.29, 0.37, 0.175, 10]} /></mesh>
              <mesh position={[0.055, 0.237, 0.255]} rotation-x={-0.17} rotation-y={0.16} material={mat('#6c6348')}><boxGeometry args={[0.47, 0.066, 0.29]} /></mesh>
            </group>
          )}
          {variant === 'mira' && (
            <>
              <mesh position={[0, 0.16, -0.035]} scale={[1.06, 0.81, 0.93]} material={mat(hair)}><icosahedronGeometry args={[0.4, 1]} /></mesh>
              {[-1, 1].map(side => (
                <group key={side}>
                  <mesh position={[side * 0.305, -0.072, 0.06]} rotation-z={side * 0.18} scale={[0.52, 1.6, 0.72]} material={mat(hair)}><icosahedronGeometry args={[0.23, 1]} /></mesh>
                  <mesh position={[side * 0.14, 0.29, 0.294]} rotation-y={side * 0.24} material={mat('#be9559', 0.52)}><torusGeometry args={[0.099, 0.026, 5, 10]} /></mesh>
                  <mesh position={[side * 0.14, 0.29, 0.285]} rotation-x={Math.PI / 2} rotation-z={side * 0.24} material={mat('#475c58', 0.36)}><cylinderGeometry args={[0.091, 0.091, 0.035, 10]} /></mesh>
                  <mesh position={[side * 0.349, -0.166, 0.154]} material={mat('#bd8e50', 0.5)}><torusGeometry args={[0.044, 0.012, 4, 8]} /></mesh>
                </group>
              ))}
              <mesh position={[-0.12, 0.173, 0.267]} rotation-z={-0.57} scale={[0.53, 1.45, 0.64]} material={mat('#926e89')}><icosahedronGeometry args={[0.202, 0]} /></mesh>
              <mesh position={[0, 0.29, 0.315]} material={mat('#be9559', 0.52)}><boxGeometry args={[0.13, 0.04, 0.035]} /></mesh>
            </>
          )}
          {variant === 'moss' && (
            <>
              <mesh position={[0, -0.22, 0.201]} scale={[1.08, 0.74, 0.65]} material={mat(hair)}><icosahedronGeometry args={[0.31, 1]} /></mesh>
              {[-1, 1].map(side => (
                <group key={side}>
                  <mesh position={[side * 0.102, -0.114, 0.345]} rotation-z={side * 0.37} scale={[1.03, 0.48, 0.46]} material={mat('#decdb9')}><icosahedronGeometry args={[0.15, 0]} /></mesh>
                  <mesh position={[side * 0.129, 0.035, 0.35]} material={mat('#514438')}><torusGeometry args={[0.094, 0.014, 5, 10]} /></mesh>
                </group>
              ))}
              <mesh position={[0, 0.04, 0.361]} material={mat('#514438')}><boxGeometry args={[0.09, 0.023, 0.026]} /></mesh>
              <group position={[0, 0.285, 0]} rotation-z={0.11}>
                <mesh material={mat('#62624a')}><cylinderGeometry args={[0.51, 0.55, 0.066, 12]} /></mesh>
                <mesh position={[0, 0.115, 0]} material={mat('#747453')}><cylinderGeometry args={[0.277, 0.36, 0.21, 10]} /></mesh>
                <mesh position={[0, 0.052, 0]} material={mat('#514438')}><cylinderGeometry args={[0.348, 0.361, 0.08, 10]} /></mesh>
              </group>
            </>
          )}
          {variant === 'jun' && (
            <>
              <mesh position={[0, 0.15, -0.08]} scale={[1.05, 0.96, 0.92]} material={mat(hair)}><icosahedronGeometry args={[0.37, 1]} /></mesh>
              <mesh position={[0.04, 0.22, 0.224]} rotation-z={0.39} scale={[1.45, 0.77, 0.68]} material={mat(hair)}><icosahedronGeometry args={[0.219, 0]} /></mesh>
              <mesh position={[0, 0.031, -0.055]} material={mat('#6c6269')}><torusGeometry args={[0.411, 0.035, 6, 14, Math.PI]} /></mesh>
              {[-1, 1].map(side => (
                <group key={side} position={[side * 0.397, -0.004, -0.055]} rotation-z={Math.PI / 2}>
                  <mesh material={mat('#38333f')}><cylinderGeometry args={[0.133, 0.133, 0.12, 10]} /></mesh>
                  <mesh position={[0, -side * 0.067, 0]} material={mat('#bc8d61', 0.54)}><cylinderGeometry args={[0.092, 0.092, 0.025, 10]} /></mesh>
                </group>
              ))}
            </>
          )}
        </group>
      </group>
    </group>
  );
}
